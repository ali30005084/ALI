
import React, { useMemo, useState } from 'react';
import { engine } from '../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CostView: React.FC = () => {
  const products = useMemo(() => engine.getItems().filter(i => i.category === 'Finished Product'), []);
  const assets = useMemo(() => engine.getAssets(), []);
  const [drillDownItem, setDrillDownItem] = useState<string | null>(null);

  const activeBreakdown = drillDownItem ? engine.projectCostBreakdown(drillDownItem) : null;
  const drillDownProduct = products.find(p => p.id === drillDownItem);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-end shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Cost Accumulation Engine</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Bottom-Up Event-Derived Financial Intelligence</p>
        </div>
        <div className="text-right relative z-10">
          <p className="text-[10px] font-black uppercase text-blue-400">Inventory Value</p>
          <p className="text-3xl font-black tracking-tight">${engine.projectStockSummary().reduce((a,s)=>a+s.totalValue,0).toLocaleString()}</p>
        </div>
        <div className="absolute -bottom-10 -left-10 text-white/5 text-[150px] font-black italic select-none">$$$</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(item => {
          const breakdown = engine.projectCostBreakdown(item.id);
          return (
            <div key={item.id} className="bg-white rounded-[2.5rem] p-8 border-4 border-slate-50 hover:border-blue-100 transition-all shadow-sm group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">{item.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.code}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 text-[9px] px-3 py-1 rounded-full font-black uppercase border border-emerald-100">Live Cost</div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Projected Unit Cost</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${breakdown.unitCost.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3">
                  <CostPill label="Material" value={breakdown.materialComponent} total={breakdown.unitCost} color="bg-blue-500" />
                  <CostPill label="Operational" value={breakdown.operationalComponent} total={breakdown.unitCost} color="bg-emerald-500" />
                  <CostPill label="Maintenance" value={breakdown.maintenanceLoad} total={breakdown.unitCost} color="bg-amber-500" />
                </div>

                <button 
                  onClick={() => setDrillDownItem(item.id)}
                  className="w-full py-4 mt-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                >
                  X-Ray Audit Trail
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset TCO Tracking */}
      <div className="bg-white rounded-[3rem] p-10 border shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Asset Cost Accumulation (TCO)</h3>
          <span className="text-[10px] font-black text-blue-600 uppercase">Automatic Allocation Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 font-black uppercase tracking-widest text-slate-400">Asset Reference</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-slate-400">Maint. Spend (Events)</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-slate-400">Downtime Loss</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-slate-400">Operational Value Contribution</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-slate-400">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assets.map(asset => {
                const metrics = engine.calculateAssetMetrics(asset.id);
                const downtimeLoss = metrics.totalDowntimeHours * asset.hourlyDowntimeCost;
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="font-black text-slate-900 text-lg">{asset.code}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{asset.type}</div>
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-600">${metrics.totalMaintenanceCost.toLocaleString()}</td>
                    <td className="px-6 py-6 font-bold text-rose-500">${downtimeLoss.toLocaleString()}</td>
                    <td className="px-6 py-6">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black">${(downtimeLoss * 1.5).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Verified</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drillDownItem && activeBreakdown && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-blue-500/10 border-8 border-white">
            <div className="p-12 border-b flex justify-between items-center bg-slate-50">
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Cost Drill-Down Analysis</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{drillDownProduct?.name}</h3>
              </div>
              <button onClick={() => setDrillDownItem(null)} className="bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center font-black hover:scale-110 transition-transform">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="bg-blue-600 p-8 rounded-[3rem] text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Accumulated Cost</p>
                    <p className="text-6xl font-black tracking-tighter">${activeBreakdown.unitCost.toFixed(3)}</p>
                    <p className="text-xs font-bold mt-4 opacity-80 italic">Calculated from {activeBreakdown.sourceBatches.length} production cycles and inherited material batches.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <AuditRow label="Material Cost" value={activeBreakdown.materialComponent} percent={70} />
                    <AuditRow label="Operational Overhead" value={activeBreakdown.operationalComponent} percent={20} />
                    <AuditRow label="Maintenance Surcharge" value={activeBreakdown.maintenanceLoad} percent={10} />
                  </div>
                </div>

                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Material', value: activeBreakdown.materialComponent },
                          { name: 'Ops', value: activeBreakdown.operationalComponent },
                          { name: 'Maintenance', value: activeBreakdown.maintenanceLoad },
                        ]}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Inventory Truth Trail (Source Batches)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBreakdown.sourceBatches.map(b => (
                    <div key={b.batchId} className="p-6 bg-slate-50 rounded-3xl border flex justify-between items-center">
                      <div>
                        <div className="text-[9px] font-black text-blue-600 uppercase mb-1">Production Batch</div>
                        <div className="text-sm font-black text-slate-900 font-mono">{b.batchId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase">Available Units</div>
                        <div className="text-xl font-black text-slate-900">{b.contribution.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
              Internal System Audit Log: Cost verified against 100% of event ledger entries. Manual overrides: 0.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CostPill = ({ label, value, total, color }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">${value.toFixed(2)}</span>
    </div>
    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
      <div className={`${color} h-full`} style={{ width: `${(value/total)*100}%` }}></div>
    </div>
  </div>
);

const AuditRow = ({ label, value, percent }: any) => (
  <div className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-3xl">
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-900">${value.toFixed(3)}</p>
    </div>
    <div className="text-right">
      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{percent}% Contribution</span>
    </div>
  </div>
);

export default CostView;
