
export enum Role {
  TECHNICIAN = 'Technician',
  OPERATOR = 'Operator',
  FOREMAN = 'Foreman',
  STOREKEEPER = 'Storekeeper',
  SECURITY = 'Security',
  PRODUCTION_SUPERVISOR = 'Production Supervisor',
  MANAGEMENT = 'Management',
  ADMIN = 'Admin'
}

export enum ItemCategory {
  RAW_MATERIAL = 'Raw Material',
  SPARE_PART = 'Spare Part',
  FINISHED_PRODUCT = 'Finished Product',
  CONSUMABLE = 'Consumable'
}

export enum EventType {
  GOODS_RECEIPT = 'Goods Receipt',
  OPENING_BALANCE = 'Opening Balance',
  INVENTORY_ISSUE = 'Inventory Issue',
  INVENTORY_TRANSFER = 'Inventory Transfer',
  INVENTORY_ADJUSTMENT = 'Inventory Adjustment',
  PRODUCTION_CYCLE_START = 'Production Cycle Start',
  PRODUCTION_CYCLE_END = 'Production Cycle End',
  PRODUCTION_WASTE = 'Production Waste',
  CONSUMPTION = 'Consumption',
  DRYING_ENTRY = 'Drying Entry',
  DRYING_EXIT = 'Drying Exit',
  GATE_IN = 'Gate In',
  GATE_OUT = 'Gate Out',
  SECURITY_CHECK = 'Security Check',
  BREAKDOWN = 'Breakdown',
  WORK_ORDER_OPEN = 'Work Order Open',
  WORK_ORDER_START = 'Work Order Start',
  WORK_ORDER_CLOSE = 'Work Order Close',
  PREVENTIVE_MAINTENANCE = 'Preventive Maintenance',
  FIX = 'Fix',
  MASTER_DATA_MODIFICATION = 'Master Data Modification',
  EVENT_REVERSAL = 'Event Reversal'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  factoryId?: string;
  status: 'Active' | 'Inactive';
}

export interface Factory {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Inactive';
  deactivatedAt?: number;
}

export interface Warehouse {
  id: string;
  factoryId: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
}

export interface Asset {
  id: string;
  factoryId: string;
  code: string;
  type: string;
  hourlyDowntimeCost: number;
  idealCycleTimeMs: number; // For Performance KPI: e.g. 15000ms per unit
  status: 'Active' | 'Inactive';
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  uom: string;
  bom?: { itemId: string; quantity: number }[];
  status: 'Active' | 'Inactive';
  unitsPerPallet?: number;
  curingDurationHours?: number;
}

export interface SystemEvent {
  id: string;
  type: EventType;
  factoryId: string;
  recordedAt: number;
  occurredAt: number;
  userId: string;
  entityId: string;
  location: string;
  details: any;
  isReversed?: boolean;
  reversedById?: string;
}

export interface BatchRecord {
  batchId: string;
  itemId: string;
  warehouseId: string;
  initialQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  receivedAt: number;
  expiryDate?: number;
  costSourceEvents?: string[];
}

export interface StockSummary {
  itemId: string;
  itemName: string;
  category: string;
  uom: string;
  totalQuantity: number;
  totalValue: number;
  inCuring?: number;
  readyForDispatch?: number;
}

export interface AssetMetrics {
  mtbfHours: number;
  mttrHours: number;
  healthScore: number;
  totalDowntimeHours: number;
  totalMaintenanceCost: number;
  isDown: boolean;
  activeWorkOrderId?: string;
}

export interface OEEBreakdown {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  confidenceScore: number; // 0-100 based on data density
}
