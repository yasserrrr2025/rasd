
import React, { useState, useMemo, useEffect } from 'react';
import { RasedSummary, Period, TeacherMapping } from '../types';

interface AdvancedAnalyticsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [snapshot, setSnapshot] = useState<RasedSummary | null>(() => {
    const saved = localStorage.getItem('rased_snapshot');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!snapshot && Object.keys(rasedSummary).length > 0) {
      localStorage.setItem('rased_snapshot', JSON.stringify(rasedSummary));
      setSnapshot(rasedSummary);
    }
  }, [rasedSummary, snapshot]);

  const heatmapData = useMemo(() => {
    const classes: string[] = [];
    const subjectsSet = new Set<string>();
    const data: Record<string, Record<string, { current: number; old?: number }>> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        const className = `${saf} - ${fasel}`;
        classes.push(className);
        data[className] = {};
        
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          
          Object.keys(pData).forEach(sub => {
            subjectsSet.add(sub);
            const currentVal = pData[sub].percentage;
            
            let oldVal: number | undefined = undefined;
            if (snapshot?.[saf]?.[fasel]?.[p]?.[sub]) {
              oldVal = snapshot[saf][fasel][p][sub].percentage;
            }

            data[className][sub] = { 
              current: currentVal, 
              old: oldVal 
            };
          });
        });
      }
    }
    return { 
      classList: classes, 
      subjectList: Array.from(subjectsSet).sort(), 
      values: data 
    };
  }, [rasedSummary, period, snapshot]);

  const getHeatStyles = (val: number | undefined) => {
    if (val === undefined) return 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600';
    if (val === 100) return 'bg-emerald-600 text-white';
    if (val >= 80) return 'bg-emerald-400 text-emerald-950';
    if (val >= 50) return 'bg-amber-400 text-amber-950';
    if (val >= 25) return 'bg-orange-500 text-white';
    return 'bg-rose-600 text-white';
  };

  const renderTrend = (current: number, old?: number) => {
    if (old === undefined || current === old) return null;
    const diff = Number((current - old).toFixed(1));
    if (diff > 0) return <span className="text-[9px] font-black text-emerald-200 flex items-center justify-center">↑ {diff}%</span>;
    return <span className="text-[9px] font-black text-rose-200 flex items-center justify-center">↓ {Math.abs(diff)}%</span>;
  };

  const manualResetSnapshot = () => {
    if (window.confirm("هل تريد تحديث النقطة المرجعية لتكون هي بيانات اليوم؟ سيؤدي هذا لتصفير فروقات النسب الحالية.")) {
      localStorage.setItem('rased_snapshot', JSON.stringify(rasedSummary));
      setSnapshot(rasedSummary);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full px-2">
      {/* Expanded Heatmap Section */}
      <section className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <span className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-2xl text-xl shadow-sm">📊</span>
            <div>
              <h3 className="text-xl font-black dark:text-white">خريطة الإنجاز والمتابعة الميدانية</h3>
              <p className="text-slate-400 text-[10px] font-bold">عرض موسّع لاستيعاب كافة المواد والفصول بوضوح تام</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <LegendItem color="bg-rose-600" label="متأخر" />
            <LegendItem color="bg-amber-400" label="متوسط" />
            <LegendItem color="bg-emerald-500" label="مكتمل" />
            <button 
              onClick={() => window.print()}
              className="no-print mr-4 bg-slate-800 text-white px-4 py-1.5 rounded-lg text-[9px] font-black hover:bg-slate-700 transition-all"
            >
              ⎙ طباعة الخريطة
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner no-scrollbar">
          <table className="w-full text-center border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-4 border-b-2 border-slate-200 dark:border-slate-700 text-[10px] font-black sticky right-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-md w-32">الفصل / المادة</th>
                {heatmapData.subjectList.map((sub) => (
                  <th key={sub} className="p-3 border-b-2 border-slate-200 dark:border-slate-700 text-[8px] font-black dark:text-slate-300 leading-tight">
                    <div className="rotate-0 md:rotate-[-45deg] whitespace-normal h-12 flex items-center justify-center">
                      {sub}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.classList.map((cls) => {
                const parts = cls.split(' - ');
                const saf = parts[0];
                const fasel = parts[1];

                return (
                  <tr key={cls} className="group/row">
                    <td className="p-3 bg-white dark:bg-slate-900 font-bold text-[9px] sticky right-0 z-20 text-right border-l border-slate-100 dark:border-slate-800 shadow-sm group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800 transition-colors w-32">
                      {cls}
                    </td>
                    {heatmapData.subjectList.map(sub => {
                      const valObj = heatmapData.values[cls][sub];
                      const currentVal = valObj?.current;
                      const oldVal = valObj?.old;
                      const teachers = teacherMapping[saf]?.[fasel]?.[sub] || [];
                      
                      return (
                        <td 
                          key={`${cls}-${sub}`} 
                          className={`
                            relative p-2 border border-slate-50 dark:border-slate-800 transition-all duration-300
                            hover:z-30 hover:scale-[1.15] hover:shadow-2xl hover:rounded-lg cursor-default
                            ${getHeatStyles(currentVal)}
                          `}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5 min-h-[45px]">
                            <span className="text-[11px] font-black leading-none">{currentVal !== undefined ? `${currentVal}%` : '-'}</span>
                            {renderTrend(currentVal || 0, oldVal)}
                            {teachers.length > 0 && (
                              <span className="text-[7px] font-bold opacity-90 mt-1 truncate max-w-[90px] text-center" title={teachers.join(' ، ')}>
                                {teachers[0]}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Snapshot Section adjusted to full width */}
      <section className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group w-full">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-[150px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 items-center">
          <div className="text-right space-y-4">
            <div className="inline-flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400">
              <span className="animate-pulse">●</span> نظام الأرشفة الذكي
            </div>
            <h3 className="text-2xl md:text-3xl font-black leading-tight">كيف تستفيد من تتبع النسب؟</h3>
            <p className="text-slate-400 font-bold text-xs md:text-sm leading-relaxed">
              يقوم النظام <span className="text-emerald-400">تلقائياً</span> بحفظ حالة الرصد عند كل رفع للملفات. الفائدة الحقيقية تكمن في معرفة مقدار التقدم اليومي لكل مادة، تحديد المعلمين المستجيبين، وتوفير تقرير دقيق للقائد التربوي.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-2xl mb-4">🔄</div>
            <h4 className="text-lg font-black mb-2">إعادة تعيين نقطة المقارنة</h4>
            <p className="text-slate-400 text-[10px] font-bold mb-6 leading-relaxed">جعل بيانات "الآن" هي المرجع الجديد للمقارنات القادمة.</p>
            <button 
              onClick={manualResetSnapshot}
              className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-xs hover:bg-slate-200 transition-all shadow-xl"
            >
              تحديث المرجع الآن
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2 px-2 py-1">
    <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm border border-black/5`}></div>
    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">{label}</span>
  </div>
);

export default AdvancedAnalytics;
