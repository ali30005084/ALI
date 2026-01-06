
import React, { useMemo, useState } from 'react';
import { engine } from '../store';
import AuditTrail from './AuditTrail';
import { EventType } from '../types';

const Dashboard: React.FC = () => {
  const [showAudit, setShowAudit] = useState(false);
  const [drillDownFilter, setDrillDownFilter] = useState<string | undefined>(undefined);
  
  const kpis = useMemo(() => engine.projectKPIs(), []);
  const events = useMemo(() => engine.getEvents().slice(0, 5), []);

  const openDrillDown = (typeFilter?: string) => {
    setDrillDownFilter(typeFilter);
    setShowAudit(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Section 9: Decision Integrity</h2>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">Event-Projected Operations</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${kpis.confidence > 70 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Confidence: {kpis.confidence}%</span>
          </div>
        </div>
        <button 
          onClick={() => openDrillDown()}
          className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
        >
          Verify Full Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="OEE" 
          val={`${kpis.oee.toFixed(1)}%`} 
          desc="Overall Effectiveness" 
          onClick={() => openDrillDown()}
          status={kpis.oee > 80 ? 'green' : 'amber'}
        />
        <KPICard 
          label="Availability" 
          val={`${kpis.availability.toFixed(1)}%`} 
          desc="Uptime Integrity" 
          onClick={() => openDrillDown('Breakdown')}
        />
        <KPICard 
          label="Performance" 
          val={`${kpis.performance.toFixed(1)}%`} 
          desc="Cycle Speed vs Standard" 
          onClick={() => openDrillDown('Production Cycle End')}
        />
        <KPICard 
          label="Quality" 
          val={`${kpis.quality.toFixed(1)}%`} 
          desc="Yield Confidence" 
          onClick={() => openDrillDown('Production Waste')}
          status={kpis.quality < 95 ? 'rose' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border-4 border-slate-50 p-10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Reality Stream</h3>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100">Synchronized Ledger</span>
          </div>
          
          <div className="space-y-4 relative z-10">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-sm text-sm border">
                    {e.type[0]}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-blue-600 tracking-tighter mb-0.5">{e.type}</div>
                    <div className="text-base font-black text-slate-900 tracking-tight">{e.entityId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(e.occurredAt).toLocaleTimeString()}</div>
                  <div className="text-[9px] font-black text-slate-300 mt-1 uppercase tracking-widest">Verified Entry</div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-10 -right-10 text-slate-50 text-[180px] font-black rotate-12 select-none pointer-events-none italic opacity-30">LEDGER</div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col justify-between shadow-2xl relative">
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-8">Decision Audit</h3>
            <p className="text-2xl font-bold tracking-tight leading-tight mb-8">
              "System projections are derived exclusively from immutable physical events. No manual adjustments exist."
            </p>
            <ul className="space-y-5">
              <AuditPoint text="MTBF Derived from Failures" />
              <AuditPoint text="OEE Calculation Auditable" />
              <AuditPoint text="No Guesstimated Rates" />
            </ul>
          </div>
          <div className="pt-12 relative z-10">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Factory Compliance Status</div>
             <div className="text-lg font-black text-emerald-500 uppercase mt-1">100% TRANSPARENT</div>
          </div>
          <div className="absolute -top-20 -left-20 text-white/5 text-[300px] font-black select-none pointer-events-none">OK</div>
        </div>
      </div>

      {showAudit && (
        <AuditTrail 
          onClose={() => setShowAudit(false)} 
          typeFilter={drillDownFilter}
        />
      )}
    </div>
  );
};

const KPICard = ({ label, val, desc, onClick, status = 'default' }: any) => {
  const statusStyles: any = {
    green: 'border-emerald-100 bg-white hover:border-emerald-500',
    amber: 'border-amber-100 bg-white hover:border-amber-500',
    rose: 'border-rose-100 bg-white hover:border-rose-500',
    default: 'border-slate-50 bg-white hover:border-blue-500'
  };
  const textColors: any = {
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    default: 'text-slate-900'
  };

  return (
    <button 
      onClick={onClick}
      className={`text-left p-8 rounded-[2.5rem] border-4 transition-all shadow-sm group active:scale-95 ${statusStyles[status]}`}
    >
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">{label}</div>
      <div className={`text-4xl font-black tracking-tighter mb-2 ${textColors[status]}`}>{val}</div>
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{desc}</div>
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Trace to Source</span>
        <span className="text-xs">→</span>
      </div>
    </button>
  );
};

const AuditPoint = ({ text }: { text: string }) => (
  <div className="flex items-center space-x-4">
    <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
    </div>
    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{text}</span>
  </div>
);

export default Dashboard;
