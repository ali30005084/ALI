
import React, { useState, useMemo } from 'react';
import { engine } from '../store';

const AdminView: React.FC<{ userId: string }> = ({ userId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'factories' | 'warehouses' | 'assets'>('factories');
  const [showModal, setShowModal] = useState(false);

  const factories = useMemo(() => engine.getFactories(), []);
  const warehouses = useMemo(() => engine.getWarehouses(), []);
  const assets = useMemo(() => engine.getAssets(), []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    const entityType = activeSubTab === 'factories' ? 'Factory' : activeSubTab === 'warehouses' ? 'Warehouse' : 'Asset';
    engine.modifyMasterData(entityType as any, userId, data);
    
    setShowModal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-2 border flex space-x-2">
        {(['factories', 'warehouses', 'assets'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black tracking-tighter uppercase text-slate-900">Manage {activeSubTab}</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500"
        >
          + Add {activeSubTab.slice(0, -1)}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeSubTab === 'factories' && factories.map(f => (
          <EntityCard key={f.id} title={f.name} sub={f.location} id={f.id} />
        ))}
        {activeSubTab === 'warehouses' && warehouses.map(w => (
          <EntityCard key={w.id} title={w.name} sub={w.type} id={w.id} factoryId={w.factoryId} />
        ))}
        {activeSubTab === 'assets' && assets.map(a => (
          <EntityCard key={a.id} title={a.code} sub={a.type} id={a.id} factoryId={a.factoryId} />
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleAdd} className="bg-white rounded-[3rem] w-full max-w-md p-10 animate-in zoom-in">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Add {activeSubTab.slice(0, -1)}</h3>
            <div className="space-y-4">
              <input name="name" placeholder="Name / Code" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" required />
              {activeSubTab === 'factories' && <input name="location" placeholder="Physical Location" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />}
              {activeSubTab !== 'factories' && (
                <select name="factoryId" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs" required>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              {activeSubTab === 'warehouses' && <input name="type" placeholder="Warehouse Type (e.g. Silo, Depot)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />}
              {activeSubTab === 'assets' && (
                <>
                  <input name="code" placeholder="Asset Identifier" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
                  <input name="type" placeholder="Machine Category" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
                  <input name="hourlyDowntimeCost" type="number" placeholder="Downtime Cost per Hour ($)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
                </>
              )}
            </div>
            <div className="flex space-x-3 mt-10">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs">Cancel</button>
              <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Commit Definition</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const EntityCard = ({ title, sub, id, factoryId }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 hover:border-blue-100 transition-all shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{title}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
      </div>
      <span className="text-[9px] bg-slate-50 text-slate-400 px-2 py-1 rounded font-mono">{id}</span>
    </div>
    {factoryId && (
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[8px] font-black uppercase text-slate-300">Belongs to: {factoryId}</span>
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
      </div>
    )}
  </div>
);

export default AdminView;
