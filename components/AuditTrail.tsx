
import React, { useMemo } from 'react';
import { engine } from '../store';
import { SystemEvent } from '../types';

interface AuditTrailProps {
  entityId?: string;
  typeFilter?: string; // New: Filter by EventType or partial string
  onClose: () => void;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ entityId, typeFilter, onClose }) => {
  const events = useMemo(() => engine.getEvents(e => {
    const matchEntity = !entityId || e.entityId === entityId;
    const matchType = !typeFilter || e.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchEntity && matchType;
  }), [entityId, typeFilter]);

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[200] flex flex-col p-6 md:p-16 animate-in fade-in">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">Truth Audit Drill-Down</h2>
          <div className="flex items-center space-x-3 mt-4">
            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              {typeFilter ? `Filter: ${typeFilter}` : 'Master Ledger'}
            </span>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{events.length} Events Verified</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="bg-white text-slate-950 w-16 h-16 rounded-full flex items-center justify-center font-black text-xl hover:scale-110 transition-transform shadow-2xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-6 custom-scrollbar">
        {events.map(e => (
          <div key={e.id} className={`p-8 rounded-[2.5rem] border-2 transition-all group ${e.isReversed ? 'bg-slate-900/50 border-slate-800 opacity-30 grayscale' : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/[0.07]'}`}>
            <div className="flex flex-wrap justify-between items-start gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${e.isReversed ? 'bg-slate-800 text-slate-500' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}>
                    {e.type}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono tracking-tighter">UID: {e.id}</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">{e.entityId}</div>
                <div className="text-[10px] text-blue-500 font-bold uppercase mt-2 tracking-widest">Operator: {e.userId} • Location: {e.location}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-slate-300 uppercase tracking-tighter">Event Time: {new Date(e.occurredAt).toLocaleString()}</div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-1">Ledger Entry: {new Date(e.recordedAt).toLocaleString()}</div>
                {e.isReversed && (
                  <div className="text-rose-500 text-[11px] font-black uppercase mt-4 tracking-widest flex items-center justify-end">
                    <span className="mr-2">⚠</span> Void Transaction
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.entries(e.details).map(([k, v]) => (
                <div key={k} className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{k}</div>
                  <div className="text-sm font-black text-slate-100 truncate">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20 py-40">
            <div className="text-[120px] font-black text-slate-700 italic">EMPTY</div>
            <p className="text-xl font-black text-slate-500 uppercase tracking-[0.5em]">No Verification Data Found</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">FOCIS v1.5 Immutable Audit Chain • Integrity Verified</p>
      </div>
    </div>
  );
};

export default AuditTrail;
