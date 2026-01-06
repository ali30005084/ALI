
import React, { useState, useMemo } from 'react';
import { engine } from '../store';
import { EventType, ItemCategory } from '../types';

const InventoryView: React.FC<{ userId: string }> = ({ userId }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'batches'>('summary');
  const [showModal, setShowModal] = useState<null | 'receipt' | 'issue' | 'adjust'>(null);
  
  const summary = useMemo(() => engine.projectStockSummary(), []);
  const batches = useMemo(() => engine.projectInventoryByBatch().filter(b => b.remainingQuantity > 0), []);
  const items = useMemo(() => engine.getItems(), []);
  const warehouses = useMemo(() => engine.getWarehouses(), []);

  const [formData, setFormData] = useState({
    itemId: '',
    warehouseId: '',
    batchId: '',
    quantity: 0,
    unitPrice: 0,
    expiryDate: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showModal === 'receipt') {
      engine.recordEvent(EventType.GOODS_RECEIPT, userId, formData.itemId, {
        warehouseId: formData.warehouseId,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).getTime() : null
      });
    } else if (showModal === 'adjust') {
      engine.recordEvent(EventType.INVENTORY_ADJUSTMENT, userId, formData.itemId, {
        batchId: formData.batchId,
        quantity: formData.quantity,
        reason: formData.reason
      });
    }
    setShowModal(null);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          <ActionButton label="Goods Receipt" icon="📥" onClick={() => setShowModal('receipt')} color="emerald" />
          <ActionButton label="Adjustment" icon="⚖️" onClick={() => setShowModal('adjust')} color="rose" />
        </div>
        <div className="bg-slate-200 p-1 rounded-2xl flex">
          <button 
            onClick={() => setViewMode('summary')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >Summary</button>
          <button 
            onClick={() => setViewMode('batches')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'batches' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >Physical Batches</button>
        </div>
      </div>

      {viewMode === 'summary' ? (
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Item</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Status</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400 text-right">In Curing (Pallets)</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400 text-right">Ready for Dispatch</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400 text-right">Physical Value</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-900">{s.itemName}</td>
                  <td className="px-8 py-6">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-500">{s.category}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {s.category === 'Finished Product' ? (
                      <span className="font-black text-amber-600 text-lg">{(s.inCuring || 0).toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-blue-600 text-lg">{s.totalQuantity.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-bold text-slate-600">${s.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="px-8 py-6 font-bold text-slate-400 uppercase">{s.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {batches.map(b => {
            const item = items.find(i => i.id === b.itemId);
            const wh = warehouses.find(w => w.id === b.warehouseId);
            return (
              <div key={b.batchId} className="bg-white p-6 rounded-3xl border-2 border-slate-50 hover:border-blue-100 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">{item?.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{wh?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-300 block">{b.batchId}</span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Physical Batch</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Qty On Hand</p>
                    <p className="text-lg font-black text-blue-600">{b.remainingQuantity} <span className="text-[10px]">{item?.uom}</span></p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Unit Cost</p>
                    <p className="text-lg font-black text-slate-900">${b.unitCost}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Verified At</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">{new Date(b.receivedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] w-full max-w-md p-10 animate-in zoom-in">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter">
              {showModal === 'receipt' ? 'Manual Receipt Adjustment' : 'Inventory Correction'}
            </h3>
            <div className="space-y-4">
              {showModal === 'adjust' ? (
                <>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs" onChange={e => setFormData({...formData, batchId: e.target.value})} required>
                    <option value="">Select Batch to Adjust...</option>
                    {batches.map(b => <option key={b.batchId} value={b.batchId}>Batch {b.batchId.slice(-4)} ({b.remainingQuantity} left)</option>)}
                  </select>
                  <input type="number" step="any" placeholder="Adjustment Qty (Negative to subtract)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} required />
                  <input placeholder="Justification (Mandatory)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setFormData({...formData, reason: e.target.value})} required />
                </>
              ) : (
                <>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs" onChange={e => setFormData({...formData, itemId: e.target.value})} required>
                    <option value="">Select Item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs" onChange={e => setFormData({...formData, warehouseId: e.target.value})} required>
                    <option value="">Select Storage Location...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Quantity" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} required />
                    <input type="number" placeholder="Unit Price ($)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value)})} required />
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-3 mt-10">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs">Cancel</button>
              <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Commit Ledger Entry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ label, icon, onClick, color }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    rose: 'bg-rose-600 hover:bg-rose-700'
  };
  return (
    <button 
      onClick={onClick}
      className={`${colors[color]} text-white px-8 py-4 rounded-2xl flex items-center shadow-lg transition-all active:scale-95`}
    >
      <span className="mr-3 text-lg">{icon}</span>
      <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  );
};

export default InventoryView;
