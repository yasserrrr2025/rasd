
import React from 'react';
import { RasedSummary, Period } from '../types';

interface TrackingTablesProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const TrackingTables: React.FC<TrackingTablesProps> = ({ rasedSummary, period }) => {
  const STUDENTS_PER_PAGE = 35;

  const pages = React.useMemo(() => {
    const result: any[] = [];
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    // ترتيب الصفوف والفصول لضمان التناسق
    const sortedSafs = Object.keys(rasedSummary).sort();

    for (const saf of sortedSafs) {
      const sortedFasels = Object.keys(rasedSummary[saf]).sort();
      for (const fasel of sortedFasels) {
        // عند اختيار الفترتين، سيتم وضع الفترة الأولى ثم الفترة الثانية تحتها مباشرة لكل فصل
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;

          const subjects = Object.keys(pData).sort();
          if (subjects.length === 0) return;

          const allStudents = new Set<string>();
          subjects.forEach(s => pData[s].studentsList.forEach(st => allStudents.add(st)));
          
          const sortedStudents = Array.from(allStudents).sort();
          const totalPages = Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE);

          for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
            const start = pageIdx * STUDENTS_PER_PAGE;
            const end = start + STUDENTS_PER_PAGE;
            result.push({
              saf,
              fasel,
              period: p,
              subjects,
              students: sortedStudents.slice(start, end),
              page: pageIdx + 1,
              totalPages,
              startIdx: start
            });
          }
        });
      }
    }
    return result;
  }, [rasedSummary, period]);

  const getPeriodBadgeColor = (p: string) => {
    return p === 'أولى' ? 'bg-blue-600' : 'bg-purple-600';
  };

  return (
    <div className="space-y-16">
      {pages.map((page, pIdx) => (
        <div key={pIdx} className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 print-card print-break-before">
          <div className="bg-slate-800 text-white p-8 text-center relative overflow-hidden">
            {/* زخرفة خلفية بسيطة */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 -ml-12 -mb-12 rounded-full"></div>
            
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black">متابعة رصد الطلاب: {page.saf} - {page.fasel}</h3>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className={`${getPeriodBadgeColor(page.period)} text-white px-5 py-1 rounded-full text-sm font-black shadow-lg`}>
                  الفترة الدراسية: {page.period}
                </span>
                <span className="bg-slate-700 text-slate-300 px-4 py-1 rounded-full text-xs font-bold">
                   صفحة {page.page} من {page.totalPages}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-3 py-4 border border-slate-200 text-center font-black bg-slate-100/50 w-10">م</th>
                  <th className="px-4 py-4 border border-slate-200 font-black bg-slate-100/50 min-w-[180px]">الاسم الكامل للطالب</th>
                  {page.subjects.map(s => (
                    <th key={s} className="px-1 py-4 border border-slate-200 text-center font-black min-w-[50px] relative">
                      <div className="whitespace-nowrap transform rotate-[-90deg] translate-y-2 origin-center py-8">
                        {s}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.students.map((student, sIdx) => (
                  <tr key={student} className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-3 py-2 text-center font-black text-slate-400 border border-slate-100">{page.startIdx + sIdx + 1}</td>
                    <td className="px-4 py-2 font-bold text-slate-800 border border-slate-100">{student}</td>
                    {page.subjects.map(subj => {
                      const isRecorded = rasedSummary[page.saf][page.fasel][page.period][subj].studentRasidStatus[student];
                      return (
                        <td key={subj} className={`px-2 py-2 text-center border border-slate-100 font-black ${isRecorded ? 'text-emerald-600 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/20'}`}>
                          {isRecorded ? (
                            <span className="inline-block w-4 h-4 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200" title="تم الرصد"></span>
                          ) : (
                            <span className="inline-block w-4 h-4 bg-rose-500 rounded-full shadow-sm shadow-rose-200" title="لم يرصد"></span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold">
            <div>نظام رصد المواد - النسخة المطورة</div>
            <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrackingTables;
