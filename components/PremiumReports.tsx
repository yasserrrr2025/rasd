
import React, { useMemo } from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';
import * as XLSX from 'xlsx';

interface PremiumReportsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const PremiumReports: React.FC<PremiumReportsProps> = ({ rasedSummary, teacherMapping, period }) => {
  
  const lostStudents = useMemo(() => {
    const students: Array<{ name: string; saf: string; fasel: string; missingCount: number; missingSubjects: string[] }> = [];
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية', 'نهاية فصل'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        const studentStats: Record<string, { count: number; subs: string[] }> = {};
        
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          for (const sub in pData) {
            const statusMap = pData[sub].studentRasidStatus;
            for (const student in statusMap) {
              if (statusMap[student] === false) {
                if (!studentStats[student]) studentStats[student] = { count: 0, subs: [] };
                studentStats[student].count++;
                studentStats[student].subs.push(`${sub} (${p})`);
              }
            }
          }
        });

        Object.entries(studentStats).forEach(([name, stat]) => {
          if (stat.count >= 3) {
            students.push({
              name,
              saf,
              fasel,
              missingCount: stat.count,
              missingSubjects: stat.subs
            });
          }
        });
      }
    }
    return students.sort((a, b) => b.missingCount - a.missingCount);
  }, [rasedSummary, period]);

  const exportFullExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: إحصائيات عامة
    const summaryRows: any[] = [];
    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        ['أولى', 'ثانية', 'نهاية فصل'].forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          Object.entries(pData).forEach(([sub, data]) => {
            summaryRows.push({
              "الصف": saf,
              "الفصل": fasel,
              "الفترة": p,
              "المادة": sub,
              "عدد الطلاب": data.rasidCount + data.lamRasidCount,
              "تم الرصد": data.rasidCount,
              "لم يرصد": data.lamRasidCount,
              "النسبة المئوية": `${data.percentage}%`,
              "المعلم": (teacherMapping[saf]?.[fasel]?.[sub] || []).join(' ، ')
            });
          });
        });
      }
    }
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "إحصائيات الرصد الكاملة");

    // Sheet 2: الطلاب التائهين
    const lostRows = lostStudents.map(s => ({
      "اسم الطالب": s.name,
      "الصف": s.saf,
      "الفصل": s.fasel,
      "عدد المواد المتبقية": s.missingCount,
      "المواد": s.missingSubjects.join(' - ')
    }));
    const wsLost = XLSX.utils.json_to_sheet(lostRows);
    XLSX.utils.book_append_sheet(wb, wsLost, "طلاب لم يرصد لهم");

    XLSX.writeFile(wb, `التقرير_الشامل_لرصد_المواد_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lost Students Card */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
              <span className="bg-rose-100 dark:bg-rose-900/40 p-2.5 rounded-2xl text-xl">🔍</span>
              الطلاب "التائهين"
            </h3>
            <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black border border-rose-100 dark:border-rose-900/30">
              {lostStudents.length} طلاب
            </span>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {lostStudents.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 font-bold text-sm">لا يوجد طلاب متأخرين في أكثر من 3 مواد ✨</p>
              </div>
            ) : (
              lostStudents.map((s, i) => (
                <div key={i} className="group p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-rose-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-sm dark:text-slate-200">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{s.saf} - فصل {s.fasel}</p>
                    </div>
                    <div className="bg-rose-600 text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                      {s.missingCount} مواد
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.missingSubjects.map((sub, si) => (
                      <span key={si} className="text-[8px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Export & Actions Section */}
        <div className="space-y-8">
          <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-emerald-500/20">📑</div>
              <div>
                <h3 className="text-2xl font-black mb-2">تصدير التقرير المجمع</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed">
                  احصل على ملف Excel واحد منظم يحتوي على:
                  <br /> • إحصائيات الفصول بالكامل
                  <br /> • تقرير الطلاب المتعثرين
                  <br /> • بيانات المعلمين المقصرين
                </p>
              </div>
              <button 
                onClick={exportFullExcel}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                تحميل الملف المجمع (Excel) ➜
              </button>
            </div>
          </section>

          <section className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[3rem] border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-blue-800 dark:text-blue-300 font-black mb-4 flex items-center gap-2">
              <span>💡</span> نصيحة إدارية
            </h4>
            <p className="text-blue-700/70 dark:text-blue-300/60 text-xs font-bold leading-relaxed">
              تقرير الطلاب "التائهين" يساعدك في اكتشاف الطلاب المنقطعين عن المدرسة أو الذين لديهم مشاكل تقنية في حساباتهم بنظام نور، حيث أن عدم رصد أكثر من 3 مواد لطالب واحد غالباً ما يشير لمشكلة خارجة عن إرادة المعلم.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PremiumReports;
