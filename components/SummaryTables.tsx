
import React, { useState } from 'react';
import { RasedSummary, TeacherMapping, Period, SubjectData } from '../types';

interface SummaryTablesProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

interface SelectedDetails {
  saf: string;
  fasel: string;
  period: string;
  subject: string;
  teachers: string[];
  data: SubjectData;
}

const SummaryTables: React.FC<SummaryTablesProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails | null>(null);
  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'مقارنة الفترتين الشاملة';
  const hasTeachers = Object.keys(teacherMapping).length > 0;

  const closeModal = () => setSelectedDetails(null);

  return (
    <div className="space-y-12 relative">
      {/* Modal for Detailed Stats */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-slate-800 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <h4 className="text-xl font-black">تفاصيل المادة: {selectedDetails.subject}</h4>
                <div className="flex gap-4 mt-2 text-slate-400 text-[10px] font-bold">
                  <span className="bg-white/5 px-2 py-0.5 rounded-lg">{selectedDetails.saf} - {selectedDetails.fasel}</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded-lg">الفترة: {selectedDetails.period}</span>
                </div>
                {hasTeachers && (
                  <div className="mt-4 flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-xl text-xs font-bold text-blue-300 border border-blue-500/10">
                    <span className="bg-blue-500/20 p-1 rounded-md">👨‍🏫</span> المعلم: {selectedDetails.teachers.join(' ، ')}
                  </div>
                )}
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-500 transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="تم الرصد" val={selectedDetails.data.rasidCount} color="emerald" />
                <StatBox label="لم يرصد" val={selectedDetails.data.lamRasidCount} color="rose" />
                <StatBox label="النسبة" val={`${selectedDetails.data.percentage}%`} color="blue" />
              </div>

              <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 w-12 text-center">م</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400">اسم الطالب</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 text-center">حالة الرصد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.data.studentsList.map((student, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-2.5 text-[10px] font-bold text-slate-300 text-center">{idx + 1}</td>
                        <td className="px-5 py-2.5 text-xs font-bold text-slate-700">{student}</td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black ${selectedDetails.data.studentRasidStatus[student] ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedDetails.data.studentRasidStatus[student] ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {selectedDetails.data.studentRasidStatus[student] ? 'مكتمل' : 'متبقي'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Zir Close */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
               <button 
                 onClick={closeModal}
                 className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-700 transition-all shadow-xl"
               >
                 إغلاق النافذة
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables Section */}
      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <div key={saf} className="space-y-8">
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
            const hasData = targetPeriods.some(p => periodsData[p] && Object.keys(periodsData[p]).length > 0);
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="space-y-4 print-avoid-break">
                {/* Header div needs to stay with its tables */}
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl text-center print-card relative overflow-hidden print-header-stay">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <h3 className="text-xl font-black relative z-10">إحصائيات {saf} - {fasel}</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase mt-1 relative z-10">{periodLabel}</p>
                </div>

                <div className={`grid gap-6 ${period === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const subjects = periodsData[p];
                    if (!subjects) return null;

                    return (
                      <div key={p} className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden print-card transition-all hover:shadow-2xl">
                        <div className={`py-3 px-6 text-white font-black text-xs flex justify-between items-center ${p === 'أولى' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                          <span>نتائج الفترة {p}</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[9px] uppercase">المواد: {Object.keys(subjects).length}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                <th className="px-4 py-3">المادة (اضغط للتفاصيل)</th>
                                {hasTeachers && <th className="px-4 py-3">المعلم</th>}
                                <th className="px-4 py-3 text-center">الطلاب</th>
                                <th className="px-4 py-3 text-center">الإنجاز</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjects).map(([subj, data], idx) => {
                                const teachers = teacherMapping[saf]?.[fasel]?.[subj] || ["---"];
                                return (
                                  <tr key={idx} className={`border-b border-slate-50 transition-colors hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                    <td className="px-4 py-3">
                                      <button 
                                        onClick={() => setSelectedDetails({ saf, fasel, period: p, subject: subj, teachers, data })} 
                                        className="font-bold text-slate-800 text-[11px] text-right group flex flex-col items-start"
                                      >
                                        <span className="group-hover:text-blue-600 transition-colors">{subj}</span>
                                        <span className="text-[8px] text-blue-400 font-black opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 no-print">اضغط للتفاصيل ➜</span>
                                      </button>
                                    </td>
                                    {hasTeachers && <td className="px-4 py-3 text-slate-500 text-[9px] font-bold">{teachers.join('، ')}</td>}
                                    <td className="px-4 py-3 text-center text-[9px] font-black text-slate-400">
                                      {data.rasidCount} / {data.rasidCount + data.lamRasidCount}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                        <span className={`text-[9px] font-black ${data.percentage === 100 ? 'text-emerald-500' : 'text-slate-600'}`}>{data.percentage}%</span>
                                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${data.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${data.percentage}%` }}></div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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

const StatBox = ({ label, val, color }: any) => (
  <div className={`p-4 rounded-[1.5rem] text-center border shadow-sm ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
    <span className="block text-[9px] font-black uppercase opacity-60 mb-1 tracking-widest">{label}</span>
    <span className="text-xl font-black tabular-nums">{val}</span>
  </div>
);

export default SummaryTables;
