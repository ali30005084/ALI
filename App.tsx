
import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, EventType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InventoryView from './components/InventoryView';
import MaintenanceView from './components/MaintenanceView';
import CostView from './components/CostView';
import SecurityView from './components/SecurityView';
import AdminView from './components/AdminView';
import IntegrityView from './components/IntegrityView';
import { engine } from './store';

const ProductionView: React.FC<{ userId: string }> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'cycle' | 'drying' | 'waste'>('cycle');
  const [showModal, setShowModal] = useState<string | null>(null);
  const products = useMemo(() => engine.getItems().filter(i => i.category === 'Finished Product'), []);
  const assets = useMemo(() => engine.getAssets(), []);
  const dryingSlots = useMemo(() => engine.projectDryingSlots(), []);
  
  const [formData, setFormData] = useState({ productId: '', palletCount: 0, lineId: '', slotId: '' });

  const handleStartCycle = () => {
    engine.recordEvent(EventType.PRODUCTION_CYCLE_START, userId, formData.lineId, { productId: formData.productId });
    setShowModal(null);
    window.location.reload();
  };

  const handleEndCycle = (cycleEventId: string, lineId: string, productId: string) => {
    engine.recordEvent(EventType.PRODUCTION_CYCLE_END, userId, lineId, { 
      productId, 
      palletCount: formData.palletCount,
      startEventId: cycleEventId 
    });
    engine.recordEvent(EventType.DRYING_ENTRY, userId, productId, {
      slotId: formData.slotId,
      palletCount: formData.palletCount,
      productId: productId
    });
    setShowModal(null);
    window.location.reload();
  };

  const handleDryingExit = (slotId: string, entryEventId: string, productId: string, palletCount: number) => {
    engine.recordEvent(EventType.DRYING_EXIT, userId, productId, {
      slotId,
      entryEventId,
      productId,
      palletCount
    });
    window.location.reload();
  };

  const activeCycles = engine.getEvents(e => e.type === EventType.PRODUCTION_CYCLE_START && !e.isReversed)
    .filter(start => !engine.getEvents(e => e.type === EventType.PRODUCTION_CYCLE_END && e.details.startEventId === start.id).length);

  return (
    <div className="space-y-8">
      <div className="bg-white p-3 rounded-[2rem] border-4 border-slate-50 flex space-x-2 max-w-md shadow-sm">
        {(['cycle', 'drying', 'waste'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'cycle' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {assets.map(asset => {
              const active = activeCycles.find(c => c.entityId === asset.id);
              const product = active ? products.find(p => p.id === active.details.productId) : null;
              return (
                <div key={asset.id} className="bg-white p-10 rounded-[3rem] border shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tighter text-3xl italic">{asset.code}</h4>
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {active ? `ACTIVE CYCLE: ${product?.name}` : 'AWAITING DISPATCH'}
                      </p>
                    </div>
                  </div>
                  {active ? (
                    <button 
                      onClick={() => { setFormData({...formData, lineId: asset.id, productId: product!.id}); setShowModal('END'); }}
                      className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-100"
                    >
                      Cycle Termination
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setFormData({...formData, lineId: asset.id}); setShowModal('START'); }}
                      className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all"
                    >
                      Authorize Start
                    </button>
                  )}
                  <div className="absolute -bottom-10 -left-10 text-slate-50 text-[180px] font-black italic select-none pointer-events-none group-hover:text-blue-50 transition-colors">
                    {asset.code.slice(0, 2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'drying' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {dryingSlots.map(slot => {
            const currentPallets = slot.pallets.reduce((a,p) => a + p.palletCount, 0);
            return (
              <div key={slot.id} className="bg-white p-10 rounded-[3rem] border shadow-sm flex flex-col h-full hover:border-blue-100 transition-all">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-2xl italic">{slot.id}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Occupancy: {currentPallets} pallets</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-6">
                  {slot.pallets.map((p, idx) => {
                    const product = products.find(pr => pr.id === p.productId);
                    const elapsedHours = (Date.now() - p.entryTime) / (1000 * 60 * 60);
                    const progress = Math.min(100, (elapsedHours / p.curingDurationHours) * 100);
                    const isReady = progress >= 100;

                    return (
                      <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-4 tracking-tight">
                          <span className="text-slate-900 truncate pr-2">{product?.name}</span>
                          <span className={isReady ? 'text-emerald-600' : 'text-amber-600'}>{isReady ? 'CERTIFIED' : 'STABILIZING'}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-6">
                          <div className={`h-full transition-all duration-1000 ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${progress}%`}}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">{p.palletCount} PLTS</span>
                          {isReady ? (
                            <button 
                              onClick={() => handleDryingExit(slot.id, p.eventId, p.productId, p.palletCount)}
                              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-100"
                            >
                              Dispatch
                            </button>
                          ) : (
                             <span className="text-[9px] font-black text-slate-300 italic">Locked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {slot.pallets.length === 0 && (
                    <div className="h-full flex items-center justify-center py-12">
                      <span className="font-black text-2xl text-slate-100 uppercase tracking-[0.5em] rotate-12 select-none">VACANT</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[4rem] w-full max-w-lg p-12 animate-in zoom-in border-8 border-white shadow-2xl shadow-blue-500/10">
            <h3 className="text-4xl font-black text-slate-900 mb-10 uppercase tracking-tighter italic">
              {showModal === 'START' ? 'System Authorization' : 'Seal Transaction'}
            </h3>
            <div className="space-y-6">
              {showModal === 'START' ? (
                <select className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black uppercase text-xs focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, productId: e.target.value})} required>
                  <option value="">Select Physical Spec...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <>
                  <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 mb-6">
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">Physical Pallet Verification</p>
                    <input 
                      type="number" 
                      placeholder="Verified Count" 
                      className="w-full bg-transparent text-5xl font-black text-blue-900 outline-none placeholder:text-blue-100" 
                      onChange={e => setFormData({...formData, palletCount: parseInt(e.target.value)})} 
                      required 
                    />
                  </div>
                  <select className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black uppercase text-xs focus:border-blue-500 outline-none" onChange={e => setFormData({...formData, slotId: e.target.value})} required>
                    <option value="">Assign Storage Destination...</option>
                    {dryingSlots.map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.capacityPallets - s.pallets.reduce((a,p) => a+p.palletCount,0)} free)</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="flex space-x-4 mt-12">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Abort</button>
              <button 
                onClick={showModal === 'START' ? handleStartCycle : () => {
                  const active = activeCycles.find(c => c.entityId === formData.lineId);
                  if (active) handleEndCycle(active.id, formData.lineId, active.details.productId);
                }} 
                className="flex-[2] py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all"
              >
                {showModal === 'START' ? 'Engage Line' : 'Commit Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('focis_auth_v1_5');
      if (savedUser) setUser(JSON.parse(savedUser));
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser: User = { id: 'u1', username: 'ops_director', fullName: 'Dr. Faisal Al-Mansoori', role: Role.ADMIN, status: 'Active' };
    setUser(mockUser);
    localStorage.setItem('focis_auth_v1_5', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('focis_auth_v1_5');
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-blue-600 font-black text-8xl italic tracking-tighter animate-pulse">FOCIS</div>;

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-white rounded-[4.5rem] p-20 w-full max-w-xl space-y-10 shadow-[0_0_150px_rgba(37,99,235,0.15)] border-[12px] border-slate-900">
        <div className="text-center mb-14">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-500/40 italic">F</div>
          <h1 className="text-6xl font-black tracking-tighter uppercase text-slate-900 italic">Integrity</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mt-4">Operational Intelligence</p>
        </div>
        <div className="space-y-6">
          <input type="text" className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" placeholder="SIGNATURE / USERNAME" required />
          <input type="password" className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] focus:border-blue-500 outline-none transition-all" placeholder="••••••••" required />
        </div>
        <button className="w-full py-10 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] hover:bg-slate-900 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-500/10">Authorize Terminal</button>
      </form>
    </div>
  );

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'inventory' && <InventoryView userId={user.id} />}
      {activeTab === 'maintenance' && <MaintenanceView userId={user.id} />}
      {activeTab === 'production' && <ProductionView userId={user.id} />}
      {activeTab === 'costs' && <CostView />}
      {activeTab === 'security' && <SecurityView userId={user.id} />}
      {activeTab === 'integrity' && <IntegrityView />}
      {activeTab === 'admin' && <AdminView userId={user.id} />}
    </Layout>
  );
};

export default App;
