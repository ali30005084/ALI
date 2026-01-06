
import React, { useMemo, useState } from 'react';
import { engine } from '../store';
import { EventType, ItemCategory, Asset, AssetMetrics } from '../types';

const MaintenanceView: React.FC<{ userId: string }> = ({ userId }) => {
  const assets = useMemo(() => engine.getAssets(), []);
  const spareParts = useMemo(() => engine.getItems().filter(i => i.category === ItemCategory.SPARE_PART), []);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'BREAKDOWN' | 'WORK_ORDER' | 'CONSUME' | 'HISTORY' | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    woId: '',
    partId: '',
    quantity: 0
  });

  const handleBreakdown = () => {
    if (!selectedAsset) return;
    const evt = engine.recordEvent(EventType.BREAKDOWN, userId, selectedAsset, { 
      description: formData.description,
      detectedBy: userId 
    });
    // Automatic WO generation as per Section 7
    engine.recordEvent(EventType.WORK_ORDER_OPEN, userId, selectedAsset, { 
      breakdownEventId: evt.id,
      priority: 'High'
    });
    closeModals();
  };

  const handleStartWork = (woId: string, assetId: string) => {
    engine.recordEvent(EventType.WORK_ORDER_START, userId, assetId, { woId });
    window.location.reload();
  };

  const handleCloseWork = (woId: string, assetId: string) => {
    engine.recordEvent(EventType.WORK_ORDER_CLOSE, userId, assetId, { 
      woId,
      conclusion: formData.description 
    });
    closeModals();
  };

  const handleSpareConsumption = (woId: string, assetId: string) => {
    const part = spareParts.find(p => p.id === formData.partId);
    engine.recordEvent(EventType.INVENTORY_ISSUE, userId, formData.partId, {
      quantity: formData.quantity,
      linkedAssetId: assetId,
      linkedWorkOrderId: woId,
      unitPrice: 125 // In real app, derived from batch
    });
    setFormData({ ...formData, partId: '', quantity: 0 });
    // Keep modal open to allow multiple parts
  };

  const closeModals = () => {
    setModalType(null);
    setSelectedAsset(null);
    setFormData({ description: '', woId: '', partId: '', quantity: 0 });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">CMMS Terminal</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Asset Health & Intervention Ledger</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-blue-400">System Integrity</p>
          <p className="text-xs font-bold text-emerald-500">History-Derived Metrics Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => {
          const metrics = engine.calculateAssetMetrics(asset.id);
          return (
            <div key={asset.id} className={`bg-white rounded-[2.5rem] border-4 transition-all shadow-sm flex flex-col ${metrics.isDown ? 'border-rose-100' : 'border-slate-50'}`}>
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1">{asset.code}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.type}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${metrics.isDown ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {metrics.isDown ? 'DOWN' : 'OPERATIONAL'}
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                <MetricBox label="Health Score" value={`${metrics.healthScore}%`} color={metrics.healthScore > 80 ? 'text-emerald-600' : metrics.healthScore > 50 ? 'text-amber-600' : 'text-rose-600'} />
                <MetricBox label="MTBF" value={`${metrics.mtbfHours}h`} />
                <MetricBox label="MTTR" value={`${metrics.mttrHours}h`} />
                <MetricBox label="Downtime" value={`${metrics.totalDowntimeHours}h`} />
              </div>

              <div className="p-6 pt-0 mt-auto space-y-2">
                {metrics.isDown ? (
                  <button 
                    onClick={() => { setSelectedAsset(asset.id); setModalType('WORK_ORDER'); }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-100"
                  >Manage Repair</button>
                ) : (
                  <button 
                    onClick={() => { setSelectedAsset(asset.id); setModalType('BREAKDOWN'); }}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-rose-100"
                  >Report Breakdown</button>
                )}
                <button 
                  onClick={() => { setSelectedAsset(asset.id); setModalType('HISTORY'); }}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-100"
                >Life-Cycle Story</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 animate-in zoom-in">
            <h3 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">
              {modalType === 'BREAKDOWN' ? 'Record Asset Failure' : 
               modalType === 'WORK_ORDER' ? 'Maintenance Control' : 
               modalType === 'HISTORY' ? 'Asset Chronology' : 'CMMS Action'}
            </h3>

            {modalType === 'BREAKDOWN' && (
              <div className="space-y-6">
                <textarea 
                  className="w-full p-6 bg-slate-50 border-2 rounded-3xl font-bold h-32 focus:border-blue-500 outline-none"
                  placeholder="Describe observed failure symptoms..."
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="flex space-x-4">
                  <button onClick={closeModals} className="flex-1 py-4 font-black uppercase text-slate-400">Abort</button>
                  <button onClick={handleBreakdown} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black uppercase">Commit Breakdown Event</button>
                </div>
              </div>
            )}

            {modalType === 'WORK_ORDER' && selectedAsset && (
              <div className="space-y-8">
                {(() => {
                  const metrics = engine.calculateAssetMetrics(selectedAsset);
                  const events = engine.getEvents(e => e.entityId === selectedAsset);
                  const activeWO = events.find(e => e.type === EventType.WORK_ORDER_OPEN && !events.some(ev => ev.type === EventType.WORK_ORDER_CLOSE && ev.details.woId === e.id));
                  const isStarted = events.some(e => e.type === EventType.WORK_ORDER_START && e.details.woId === activeWO?.id);

                  return (
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Ticket</p>
                        <p className="text-xl font-black text-slate-900">{activeWO?.id || 'NO ACTIVE WO'}</p>
                      </div>

                      {!isStarted ? (
                        <button 
                          onClick={() => handleStartWork(activeWO!.id, selectedAsset)}
                          className="w-full py-8 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl"
                        >Commence Intervention</button>
                      ) : (
                        <div className="space-y-6">
                          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                            <h5 className="text-[10px] font-black text-emerald-600 uppercase mb-4">Add Spare Parts Consumption</h5>
                            <div className="flex space-x-2">
                              <select 
                                className="flex-1 p-3 bg-white border rounded-xl font-bold text-xs"
                                onChange={e => setFormData({ ...formData, partId: e.target.value })}
                                value={formData.partId}
                              >
                                <option value="">Select Part...</option>
                                {spareParts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <input 
                                type="number" 
                                placeholder="Qty" 
                                className="w-20 p-3 bg-white border rounded-xl font-bold"
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                value={formData.quantity}
                              />
                              <button 
                                onClick={() => handleSpareConsumption(activeWO!.id, selectedAsset)}
                                className="bg-emerald-600 text-white px-6 rounded-xl font-black text-xs"
                              >ADD</button>
                            </div>
                          </div>

                          <textarea 
                            className="w-full p-6 bg-slate-50 border-2 rounded-3xl font-bold h-24 focus:border-blue-500 outline-none"
                            placeholder="Repair conclusion / Root cause details..."
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                          />
                          
                          <button 
                            onClick={() => handleCloseWork(activeWO!.id, selectedAsset)}
                            className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] shadow-xl"
                          >Finalize & Restore Asset</button>
                        </div>
                      )}
                      <button onClick={closeModals} className="w-full py-2 text-slate-300 font-black uppercase text-[10px]">Close Control Panel</button>
                    </div>
                  );
                })()}
              </div>
            )}

            {modalType === 'HISTORY' && selectedAsset && (
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {engine.getEvents(e => e.entityId === selectedAsset).map(e => (
                  <div key={e.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="text-[9px] font-black text-blue-600 uppercase">{e.type}</div>
                      <div className="text-xs font-bold text-slate-800">{new Date(e.occurredAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-slate-400">By: {e.userId}</div>
                    </div>
                  </div>
                ))}
                <button onClick={closeModals} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black mt-4">Close Ledger</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricBox = ({ label, value, color = 'text-slate-900' }: { label: string, value: string, color?: string }) => (
  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black tracking-tighter ${color}`}>{value}</p>
  </div>
);

export default MaintenanceView;
