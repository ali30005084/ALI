
import React, { useState, useMemo } from 'react';
import { engine } from '../store';
import { EventType } from '../types';

const SecurityView: React.FC<{ userId: string }> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'ledger'>('terminal');
  const [gateType, setGateType] = useState<'IN' | 'OUT'>('OUT');
  const items = useMemo(() => engine.getItems(), []);
  const history = useMemo(() => engine.projectGateHistory(), []);

  const [form, setForm] = useState({
    vehicleNo: '',
    driverName: '',
    itemId: '',
    quantity: 0,
    reference: ''
  });

  const handleGateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const eventType = gateType === 'IN' ? EventType.GATE_IN : EventType.GATE_OUT;
    
    engine.recordEvent(eventType, userId, form.itemId || 'LOGISTIC_UNIT', {
      vehicleNo: form.vehicleNo,
      driverName: form.driverName,
      quantity: form.quantity,
      reference: form.reference,
      payloadDescription: `${form.quantity} units of ${form.itemId}`
    });

    // If it's a Raw Material Gate In, we also trigger a Goods Receipt for systemic visibility
    if (gateType === 'IN' && form.itemId) {
      engine.recordEvent(EventType.GOODS_RECEIPT, userId, form.itemId, {
        quantity: form.quantity,
        warehouseId: 'wh-rm',
        unitPrice: 450 // Default price for gate-received raw material
      });
    }

    setForm({ vehicleNo: '', driverName: '', itemId: '', quantity: 0, reference: '' });
    setActiveTab('ledger');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Gate Boundary Control</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Physical Reality Verification Terminal</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'terminal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
          >Gate Terminal</button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
          >Movement Ledger</button>
        </div>
      </div>

      {activeTab === 'terminal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <form onSubmit={handleGateMovement} className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-6">
            <div className="flex bg-slate-100 p-2 rounded-[2rem] mb-6">
              <button 
                type="button"
                onClick={() => setGateType('OUT')}
                className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${gateType === 'OUT' ? 'bg-rose-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400'}`}
              >Dispatch (OUT)</button>
              <button 
                type="button"
                onClick={() => setGateType('IN')}
                className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${gateType === 'IN' ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400'}`}
              >Receipt (IN)</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Vehicle Plate" placeholder="A-12345" value={form.vehicleNo} onChange={v => setForm({...form, vehicleNo: v})} />
                <InputGroup label="Driver Identity" placeholder="Full Name" value={form.driverName} onChange={v => setForm({...form, driverName: v})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Material / Cargo</label>
                <select 
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black uppercase text-xs focus:border-blue-500 outline-none"
                  value={form.itemId}
                  onChange={e => setForm({...form, itemId: e.target.value})}
                  required
                >
                  <option value="">Select Physical Load...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.category})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Physical Quantity" type="number" placeholder="Count" value={form.quantity.toString()} onChange={v => setForm({...form, quantity: parseFloat(v)})} />
                <InputGroup label="Manifest / DO Ref" placeholder="Ref #" value={form.reference} onChange={v => setForm({...form, reference: v})} />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 mt-8 ${gateType === 'OUT' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}
            >
              Authorize Boundary Crossing
            </button>
          </form>

          <div className="space-y-6">
            <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Gate Instructions</h4>
              <p className="text-xl font-bold leading-tight relative z-10">Verify every pallet physically. Discrepancies between System Manifest and Physical Load must be flagged immediately.</p>
              <div className="absolute -bottom-8 -right-8 text-white/10 text-9xl font-black italic select-none">SAFE</div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Recent Gate Clearances</h4>
              <div className="space-y-3">
                {history.slice(0, 4).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${h.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div>
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{h.vehicleNo}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">{h.payload}</div>
                      </div>
                    </div>
                    <div className="text-[8px] font-black text-slate-300">{new Date(h.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Time</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Direction</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Vehicle</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Payload Description</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Driver</th>
                <th className="px-8 py-5 font-black uppercase text-slate-400">Gate User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${h.type === 'IN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                      {h.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">{h.vehicleNo}</td>
                  <td className="px-8 py-6 font-bold text-slate-600 truncate max-w-[200px]">{h.payload}</td>
                  <td className="px-8 py-6 font-medium text-slate-500 uppercase">{h.driverName}</td>
                  <td className="px-8 py-6">
                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{h.userId}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black placeholder:text-slate-300 focus:border-blue-500 outline-none transition-all"
      value={value}
      onChange={e => onChange(e.target.value)}
      required
    />
  </div>
);

export default SecurityView;
