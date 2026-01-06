
import { 
  SystemEvent, EventType, Item, 
  ItemCategory, Asset, Factory, Warehouse,
  BatchRecord, StockSummary, AssetMetrics, OEEBreakdown
} from './types';

export interface DBState {
  events: SystemEvent[];
  factories: Factory[];
  warehouses: Warehouse[];
  assets: Asset[];
  items: Item[];
}

const INITIAL_STATE: DBState = {
  events: [],
  factories: [
    { id: 'fac-1', name: 'Al-Ain Block Factory', location: 'Al-Ain Industrial', status: 'Active' }
  ],
  warehouses: [
    { id: 'wh-rm', factoryId: 'fac-1', name: 'Cement Silo A', type: 'Raw Material', status: 'Active' },
    { id: 'wh-fg', factoryId: 'fac-1', name: 'Yard 04 - Interlock', type: 'Finished Goods', status: 'Active' },
    { id: 'wh-drying', factoryId: 'fac-1', name: 'Curing Chamber 01', type: 'Drying Room', status: 'Active' },
    { id: 'wh-spare', factoryId: 'fac-1', name: 'Maintenance Stores', type: 'Spare Parts', status: 'Active' }
  ],
  assets: [
    { id: 'ast-line1', factoryId: 'fac-1', code: 'MASA-01', type: 'Block Press', hourlyDowntimeCost: 4500, idealCycleTimeMs: 15000, status: 'Active' },
    { id: 'ast-line2', factoryId: 'fac-1', code: 'HESS-02', type: 'Secondary Press', hourlyDowntimeCost: 3800, idealCycleTimeMs: 22000, status: 'Active' }
  ],
  items: [
    { id: 'itm-cement', code: 'RM-CEM-SRC', name: 'Sulphate Resistant Cement', category: ItemCategory.RAW_MATERIAL, uom: 'MT', status: 'Active' },
    { id: 'itm-interlock-6cm', code: 'FG-INT-6', name: 'Interlock 6cm Rectangular', category: ItemCategory.FINISHED_PRODUCT, uom: 'SQM', status: 'Active', bom: [{ itemId: 'itm-cement', quantity: 0.015 }], unitsPerPallet: 12, curingDurationHours: 24 },
    { id: 'itm-sp-bearing', code: 'SP-BRG-22', name: 'Vibrator Bearing K-90', category: ItemCategory.SPARE_PART, uom: 'PC', status: 'Active' }
  ]
};

export class FocisEngine {
  private state: DBState;

  constructor() {
    const saved = localStorage.getItem('focis_v1_5_db');
    this.state = saved ? JSON.parse(saved) : INITIAL_STATE;
  }

  private save() {
    localStorage.setItem('focis_v1_5_db', JSON.stringify(this.state));
  }

  getEvents(filter?: (e: SystemEvent) => boolean) {
    let evts = filter ? this.state.events.filter(filter) : this.state.events;
    return [...evts].sort((a,b) => b.occurredAt - a.occurredAt);
  }

  recordEvent(type: EventType, userId: string, entityId: string, details: any, factoryId?: string, occurredAt?: number) {
    const event: SystemEvent = {
      id: `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      factoryId: factoryId || this.state.factories[0].id,
      recordedAt: Date.now(),
      occurredAt: occurredAt || Date.now(),
      userId,
      entityId,
      location: details.location || 'SITE',
      details
    };
    
    this.state.events.push(event);
    this.save();
    return event;
  }

  // --- Section 9: KPI Integrity Engine ---
  calculateOEE(factoryId: string, lookbackMs: number = 24 * 3600000): OEEBreakdown {
    const cutoff = Date.now() - lookbackMs;
    const events = this.getEvents(e => e.factoryId === factoryId && e.occurredAt > cutoff && !e.isReversed);
    
    // 1. Availability = (Total Production Time - Downtime) / Total Production Time
    const assets = this.state.assets.filter(a => a.factoryId === factoryId);
    let totalDowntimeMs = 0;
    let totalPlannedTimeMs = assets.length * lookbackMs;

    assets.forEach(asset => {
      const assetEvents = events.filter(e => e.entityId === asset.id).sort((a,b) => a.occurredAt - b.occurredAt);
      let lastBreakdown: number | null = null;
      assetEvents.forEach(e => {
        if (e.type === EventType.BREAKDOWN) lastBreakdown = e.occurredAt;
        if ((e.type === EventType.WORK_ORDER_CLOSE || e.type === EventType.FIX) && lastBreakdown) {
          totalDowntimeMs += (e.occurredAt - lastBreakdown);
          lastBreakdown = null;
        }
      });
      if (lastBreakdown) totalDowntimeMs += (Date.now() - lastBreakdown);
    });

    const availability = totalPlannedTimeMs > 0 ? (totalPlannedTimeMs - totalDowntimeMs) / totalPlannedTimeMs : 0;

    // 2. Performance = (Ideal Cycle Time * Total Units Produced) / Operating Time
    let totalProduced = 0;
    let totalIdealTimeMs = 0;
    const prodEvents = events.filter(e => e.type === EventType.PRODUCTION_CYCLE_END);
    prodEvents.forEach(e => {
      const asset = assets.find(a => a.id === e.entityId);
      const product = this.state.items.find(i => i.id === e.details.productId);
      const qty = (e.details.palletCount || 0) * (product?.unitsPerPallet || 1);
      totalProduced += qty;
      totalIdealTimeMs += qty * (asset?.idealCycleTimeMs || 15000);
    });

    const operatingTimeMs = totalPlannedTimeMs - totalDowntimeMs;
    const performance = operatingTimeMs > 0 ? totalIdealTimeMs / operatingTimeMs : 0;

    // 3. Quality = Good Units / Total Units
    let wasteQty = 0;
    events.filter(e => e.type === EventType.PRODUCTION_WASTE).forEach(e => wasteQty += (e.details.quantity || 0));
    const quality = totalProduced > 0 ? (totalProduced - wasteQty) / totalProduced : 1;

    // Confidence: Do we have enough data to be credible?
    const confidence = (events.length > 5) ? 100 : events.length * 20;

    return {
      availability: Math.min(1, availability),
      performance: Math.min(1, performance),
      quality: Math.min(1, quality),
      oee: availability * performance * quality,
      confidenceScore: confidence
    };
  }

  calculateAssetMetrics(assetId: string): AssetMetrics {
    const events = this.getEvents(e => e.entityId === assetId && !e.isReversed).sort((a,b) => a.occurredAt - b.occurredAt);
    let isDown = false, lastBreakdown = null, breakdownCount = 0, repairCount = 0, totalDowntimeMs = 0, totalRepairMs = 0, maintCost = 0;

    events.forEach(e => {
      if (e.type === EventType.BREAKDOWN) {
        isDown = true;
        lastBreakdown = e.occurredAt;
        breakdownCount++;
      }
      if (e.type === EventType.WORK_ORDER_CLOSE || e.type === EventType.FIX) {
        isDown = false;
        repairCount++;
        if (lastBreakdown) {
          totalDowntimeMs += (e.occurredAt - lastBreakdown);
          const start = events.find(ev => ev.type === EventType.WORK_ORDER_START && (ev.details.woId === (e.details.woId || e.id)));
          if (start) totalRepairMs += (e.occurredAt - start.occurredAt);
          lastBreakdown = null;
        }
      }
    });

    const firstEventTime = events[0]?.occurredAt || Date.now();
    const runtimeMs = (Date.now() - firstEventTime) - totalDowntimeMs;
    const mtbf = breakdownCount > 0 ? runtimeMs / breakdownCount : runtimeMs;
    const mttr = repairCount > 0 ? totalRepairMs / repairCount : 0;

    return {
      mtbfHours: Math.round(mtbf / 3600000),
      mttrHours: parseFloat((mttr / 3600000).toFixed(2)),
      healthScore: Math.max(0, 100 - (breakdownCount * 10)),
      totalDowntimeHours: Math.round(totalDowntimeMs / 3600000),
      totalMaintenanceCost: 0, // Simplified for this view
      isDown
    };
  }

  projectKPIs() {
    const oeeData = this.calculateOEE(this.state.factories[0].id);
    const assets = this.getAssets();
    const totalMtbf = assets.reduce((acc, a) => acc + this.calculateAssetMetrics(a.id).mtbfHours, 0);
    return {
      oee: oeeData.oee * 100,
      availability: oeeData.availability * 100,
      performance: oeeData.performance * 100,
      quality: oeeData.quality * 100,
      confidence: oeeData.confidenceScore,
      mtbf: Math.round(totalMtbf / assets.length),
      factoryHealth: assets.reduce((a, s) => a + this.calculateAssetMetrics(s.id).healthScore, 0) / assets.length
    };
  }

  // --- Core Domain Methods ---
  getFactories() { return this.state.factories; }
  getAssets() { return this.state.assets; }
  getWarehouses() { return this.state.warehouses; }
  getItems() { return this.state.items; }

  // Fix: Added modifyMasterData method required by AdminView
  modifyMasterData(type: 'Factory' | 'Warehouse' | 'Asset', userId: string, data: any) {
    const id = `${type.toLowerCase().slice(0, 3)}-${Date.now()}`;
    if (type === 'Factory') {
      this.state.factories.push({ id, name: data.name, location: data.location, status: 'Active' });
    } else if (type === 'Warehouse') {
      this.state.warehouses.push({ id, factoryId: data.factoryId, name: data.name, type: data.type, status: 'Active' });
    } else if (type === 'Asset') {
      this.state.assets.push({ 
        id, 
        factoryId: data.factoryId, 
        code: data.name, 
        type: data.type, 
        hourlyDowntimeCost: parseFloat(data.hourlyDowntimeCost) || 0,
        idealCycleTimeMs: 15000,
        status: 'Active' 
      });
    }
    this.recordEvent(EventType.MASTER_DATA_MODIFICATION, userId, id, { type, data });
    this.save();
  }

  // Fix: Added projectInventoryByBatch method required by InventoryView
  projectInventoryByBatch(): BatchRecord[] {
    const batches: BatchRecord[] = [];
    const events = this.getEvents(e => !e.isReversed).sort((a, b) => a.occurredAt - b.occurredAt);

    events.forEach(e => {
      if (e.type === EventType.GOODS_RECEIPT || e.type === EventType.OPENING_BALANCE) {
        batches.push({
          batchId: e.id,
          itemId: e.entityId,
          warehouseId: e.details.warehouseId,
          initialQuantity: e.details.quantity,
          remainingQuantity: e.details.quantity,
          unitCost: e.details.unitPrice || 0,
          receivedAt: e.occurredAt,
          costSourceEvents: [e.id]
        });
      }

      if (e.type === EventType.PRODUCTION_CYCLE_END) {
        const product = this.state.items.find(i => i.id === e.details.productId);
        const qty = (e.details.palletCount || 0) * (product?.unitsPerPallet || 1);
        
        let materialCost = 0;
        product?.bom?.forEach(component => {
          let remainingToConsume = component.quantity * qty;
          const targetBatches = batches.filter(b => b.itemId === component.itemId && b.remainingQuantity > 0);
          for (const b of targetBatches) {
            const take = Math.min(remainingToConsume, b.remainingQuantity);
            b.remainingQuantity -= take;
            materialCost += take * b.unitCost;
            remainingToConsume -= take;
            if (remainingToConsume <= 0) break;
          }
        });

        batches.push({
          batchId: e.id,
          itemId: e.details.productId,
          warehouseId: 'wh-drying',
          initialQuantity: qty,
          remainingQuantity: qty,
          unitCost: qty > 0 ? (materialCost / qty) * 1.35 : 0, // Add 35% fixed overhead factor for simulation
          receivedAt: e.occurredAt,
          costSourceEvents: [e.id]
        });
      }

      if (e.type === EventType.INVENTORY_ISSUE || e.type === EventType.CONSUMPTION) {
        let remainingToConsume = e.details.quantity;
        const targetBatches = batches.filter(b => b.itemId === e.entityId && b.remainingQuantity > 0);
        for (const b of targetBatches) {
          const take = Math.min(remainingToConsume, b.remainingQuantity);
          b.remainingQuantity -= take;
          remainingToConsume -= take;
          if (remainingToConsume <= 0) break;
        }
      }
      
      if (e.type === EventType.GATE_OUT && e.entityId !== 'LOGISTIC_UNIT') {
        let remainingToConsume = e.details.quantity;
        const targetBatches = batches.filter(b => b.itemId === e.entityId && b.remainingQuantity > 0);
        for (const b of targetBatches) {
          const take = Math.min(remainingToConsume, b.remainingQuantity);
          b.remainingQuantity -= take;
          remainingToConsume -= take;
          if (remainingToConsume <= 0) break;
        }
      }
    });

    return batches;
  }

  // Fix: Implemented projectStockSummary to provide actual live inventory data
  projectStockSummary(): StockSummary[] {
    const batches = this.projectInventoryByBatch();
    const summary: Record<string, StockSummary> = {};

    this.state.items.forEach(item => {
      const itemBatches = batches.filter(b => b.itemId === item.id);
      const totalQty = itemBatches.reduce((a, b) => a + b.remainingQuantity, 0);
      const totalVal = itemBatches.reduce((a, b) => a + (b.remainingQuantity * b.unitCost), 0);
      
      summary[item.id] = {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        uom: item.uom,
        totalQuantity: totalQty,
        totalValue: totalVal,
        inCuring: 0,
        readyForDispatch: totalQty
      };
    });

    const drying = this.projectDryingSlots();
    drying.forEach(slot => {
      slot.pallets.forEach(p => {
        if (summary[p.productId]) {
          summary[p.productId].inCuring = (summary[p.productId].inCuring || 0) + p.palletCount;
        }
      });
    });

    return Object.values(summary);
  }

  // Fix: Added projectDryingSlots method required by ProductionView (App.tsx)
  projectDryingSlots() {
    const warehouses = this.state.warehouses.filter(w => w.type === 'Drying Room');
    const slots = warehouses.map(w => ({
      id: w.name,
      capacityPallets: 100,
      pallets: [] as any[]
    }));

    const events = this.getEvents(e => !e.isReversed).sort((a,b) => a.occurredAt - b.occurredAt);
    
    events.forEach(e => {
      if (e.type === EventType.DRYING_ENTRY) {
        const slot = slots.find(s => s.id === e.details.slotId);
        if (slot) {
          slot.pallets.push({
            eventId: e.id,
            productId: e.details.productId,
            palletCount: e.details.palletCount,
            entryTime: e.occurredAt,
            curingDurationHours: this.state.items.find(i => i.id === e.details.productId)?.curingDurationHours || 24
          });
        }
      }
      if (e.type === EventType.DRYING_EXIT) {
        const slot = slots.find(s => s.id === e.details.slotId);
        if (slot) {
          slot.pallets = slot.pallets.filter(p => p.eventId !== e.details.entryEventId);
        }
      }
    });

    return slots;
  }

  // Fix: Added projectCostBreakdown method required by CostView
  projectCostBreakdown(itemId: string) {
    const batches = this.projectInventoryByBatch().filter(b => b.itemId === itemId);
    const totalQty = batches.reduce((a, b) => a + b.initialQuantity, 0);
    const avgUnitCost = totalQty > 0 
      ? batches.reduce((a, b) => a + (b.initialQuantity * b.unitCost), 0) / totalQty
      : 0;
    
    return {
      unitCost: avgUnitCost,
      materialComponent: avgUnitCost * 0.7,
      operationalComponent: avgUnitCost * 0.2,
      maintenanceLoad: avgUnitCost * 0.1,
      sourceBatches: batches.map(b => ({
        batchId: b.batchId,
        contribution: b.remainingQuantity
      }))
    };
  }

  // Fix: Added projectGateHistory method required by SecurityView
  projectGateHistory() {
    return this.getEvents(e => e.type === EventType.GATE_IN || e.type === EventType.GATE_OUT)
      .map(e => ({
        id: e.id,
        type: e.type === EventType.GATE_IN ? 'IN' : 'OUT',
        vehicleNo: e.details.vehicleNo,
        payload: e.details.payloadDescription || e.entityId,
        timestamp: e.occurredAt,
        driverName: e.details.driverName,
        userId: e.userId
      }));
  }
}

export const engine = new FocisEngine();
