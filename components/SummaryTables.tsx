
import React from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

interface SummaryTablesProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const SummaryTables: React.FC<SummaryTablesProps> = ({ rasedSummary, teacherMapping, period }) => {
  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'مقارنة الفترتين (الأولى والثانية)';

  return (
    <div className="space-y-16">
      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <div key={saf} className="space-y-12">
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const subjectsByPeriod: Record<string, any[]> = {
              'أولى': [],
              'ثانية': []
            };
            
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

            targetPeriods.forEach(p => {
              const pData = periodsData[p];
              if (!pData) return;
              Object.entries(pData).forEach(([subj, data]) => {
                subjectsByPeriod[p].push({ subj, data });
              });
            });

            const hasData = subjectsByPeriod['أولى'].length > 0 || subjectsByPeriod['ثانية'].length > 0;
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="space-y-8 print-break-before">
                {/* رأس القسم للصف والفصل */}
                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl text-center print-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20"></div>
                  <h3 className="text-3xl font-black relative z-10">إحصائيات الصف {saf} - الفصل {fasel}</h3>
                  <div className="h-1.5 w-24 bg-blue-500 mx-auto mt-3 rounded-full relative z-10"></div>
                  <p className="text-blue-400 text-sm mt-4 font-black uppercase tracking-widest relative z-10">{periodLabel}</p>
                </div>

                {/* تخزين الجداول في شبكة (Grid) في حال اختيار الفترتين */}
                <div className={`grid gap-8 ${period === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const displaySubjects = subjectsByPeriod[p];
                    if (displaySubjects.length === 0) return null;

                    const periodColor = p === 'أولى' ? 'border-blue-200' : 'border-purple-200';
                    const periodHeader = p === 'أولى' ? 'bg-blue-600' : 'bg-purple-600';
                    const periodIcon = p === 'أولى' ? '❶' : '❷';

                    return (
                      <div key={p} className={`bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 ${periodColor} print-card flex flex-col h-full transition-all hover:shadow-2xl`}>
                        {/* ترويسة الفترة */}
                        <div className={`${periodHeader} py-4 px-8 text-white flex justify-between items-center`}>
                          <span className="text-lg font-black flex items-center gap-2">
                            <span className="text-2xl">{periodIcon}</span>
                            نتائج الفترة {p}
                          </span>
                          <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">
                            عدد المواد: {displaySubjects.length}
                          </span>
                        </div>

                        <div className="overflow-x-auto flex-grow">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase">المادة</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase">المعلم</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase text-center">الإنجاز</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase text-center">النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displaySubjects.map(({ subj, data }, idx) => {
                                const teachers = teacherMapping[saf]?.[fasel]?.[subj] || ["غير محدد"];
                                const percentageColor = data.percentage === 100 
                                  ? 'text-emerald-600' 
                                  : data.percentage >= 70 
                                  ? 'text-amber-600' 
                                  : 'text-rose-600';
                                
                                const barColor = data.percentage === 100 
                                  ? 'bg-emerald-500' 
                                  : data.percentage >= 70 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500';

                                return (
                                  <React.Fragment key={`${subj}-${p}`}>
                                    {teachers.map((t, tIdx) => (
                                      <tr key={tIdx} className={`border-b border-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50`}>
                                        <td className="px-5 py-3 font-bold text-slate-800 text-sm">{tIdx === 0 ? subj : ""}</td>
                                        <td className="px-5 py-3 text-slate-500 text-xs font-semibold">{t}</td>
                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                          {tIdx === 0 && (
                                            <div className="flex flex-col items-center">
                                              <span className="text-[10px] font-bold text-slate-400">
                                                {data.rasidCount} / {data.rasidCount + data.lamRasidCount}
                                              </span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-5 py-3">
                                          {tIdx === 0 && (
                                            <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                              <span className={`text-xs font-black ${percentageColor}`}>
                                                {data.percentage}%
                                              </span>
                                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${data.percentage}%` }}></div>
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* تذييل بسيط للجدول */}
                        <div className="bg-slate-50 py-3 px-6 text-[10px] text-slate-400 font-bold border-t border-slate-100">
                          نظام رصد المواد - تحليل مقارن
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SummaryTables;
