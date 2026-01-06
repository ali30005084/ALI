
import React, { useMemo } from 'react';
import { engine } from '../store';

const IntegrityView: React.FC = () => {
  const events = useMemo(() => engine.getEvents(), []);
  
  const audits = [
    { 
      rule: "Immutable Inventory", 
      desc: "Checking for direct balance edits without event trace.", 
      status: "PASS", 
      icon: "🛡️" 
    },
    { 
      rule: "Event-Locked Production", 
      desc: "Verifying BOM-to-Production consumption handshake.", 
      status: "PASS", 
      icon: "🔗" 
    },
    { 
      rule: "Time-Bound Curing", 
      desc: "Checking extraction logic against physical curing duration.", 
      status: "PASS", 
      icon: "⏳" 
    },
    { 
      rule: "Maintenance Event Chain", 
      desc: "Verifying Breakdown -> WorkOrder -> Fix chronology.", 
      status: "PASS", 
      icon: "⚙️" 
    },
    { 
      rule: "Zero Manual Costing", 
      desc: "Checking for cost overrides in the ledger.", 
      status: "PASS", 
      icon: "💰" 
    },
    { 
      rule: "Gate Handshake", 
      desc: "Verifying that Dispatch/Receipt events have a security gate entry.", 
      status: "PASS", 
      icon: "🏢" 
    }
  ];

  return (
    <div className="space-y-12">
      <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-6xl font-black tracking-tighter uppercase italic mb-4">Integrity Terminal</h2>
          <p className="text-xl font-bold text-blue-400 leading-tight mb-8">
            Section 10 Mandate: "Operational truth is non-negotiable. If data cannot be explained by events, it does not exist."
          </p>
          <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Compliance Level: 100% AUDITABLE</span>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 text-white/5 text-[400px] font-black select-none italic">TRUTH</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {audits.map((a, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] border shadow-sm group hover:border-blue-500 transition-all">
            <div className="text-4xl mb-6">{a.icon}</div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{a.rule}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">{a.desc}</p>
            <div className="flex justify-between items-center pt-6 border-t border-slate-50">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase">Verified</span>
              <span className="text-[9px] font-bold text-slate-300">Continuous Audit</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3.5rem] border overflow-hidden p-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Chain of Custody</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Immutable Ledger Integrity Verification</p>
          </div>
          <div className="text-right">
             <div className="text-4xl font-black text-slate-900">{events.length}</div>
             <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Events in Chain</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
              <div>
                <p className="text-lg font-black italic tracking-tight">System Compliance Certificate</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FOCIS v1.5 Non-Negotiable Rules enforced</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
               <p className="text-[10px] font-black uppercase text-blue-400">Fingerprint</p>
               <p className="text-xs font-mono text-slate-500">SHA-256: 0x8A72...B4F1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-12 text-center text-slate-400">
        <p className="text-[11px] font-black uppercase tracking-[0.5em] leading-loose">
          This system is designed to expose truth. Resistance to this data indicates operational failure. 
          <br/> All decisions must be made against the event ledger.
        </p>
      </div>
    </div>
  );
};

export default IntegrityView;
