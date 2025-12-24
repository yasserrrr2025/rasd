
import React from 'react';
import { RasedSummary, Period } from '../types';

interface TrackingTablesProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const TrackingTables: React.FC<TrackingTablesProps> = ({ rasedSummary, period }) => {
  const STUDENTS_PER_PAGE = 30;

  const pages = React.useMemo(() => {
    const result: any[] = [];
    const sortedSafs = Object.keys(rasedSummary).sort();

    for (const saf of sortedSafs) {
      const sortedFasels = Object.keys(rasedSummary[saf]).sort();
      for (const fasel of sortedFasels) {
        
        const allSubjectsSet = new Set<string>();
        const p1Data = rasedSummary[saf][fasel]['أولى'] || {};
        const p2Data = rasedSummary[saf][fasel]['ثانية'] || {};
        
        // تجميع المواد بناءً على الفترة المختارة
        if (period === 'أولى' || period === 'both') {
          Object.keys(p1Data).forEach(s => allSubjectsSet.add(s));
        }
        if (period === 'ثانية' || period === 'both') {
          Object.keys(p2Data).forEach(s => allSubjectsSet.add(s));
        }
        
        const sortedSubjects = Array.from(allSubjectsSet).sort();
        if (sortedSubjects.length === 0) continue;

        const allStudentsSet = new Set<string>();
        sortedSubjects.forEach(s => {
          if (p1Data[s]) p1Data[s].studentsList.forEach(st => allStudentsSet.add(st));
          if (p2Data[s]) p2Data[s].studentsList.forEach(st => allStudentsSet.add(st));
        });
        
        const sortedStudents = Array.from(allStudentsSet).sort();
        const totalPages = Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE);

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
          const start = pageIdx * STUDENTS_PER_PAGE;
          const end = start + STUDENTS_PER_PAGE;
          result.push({
            saf,
            fasel,
            subjects: sortedSubjects,
            students: sortedStudents.slice(start, end),
            page: pageIdx + 1,
            totalPages,
            startIdx: start,
            p1Data,
            p2Data
          });
        }
      }
    }
    return result;
  }, [rasedSummary, period]);

  const isBoth = period === 'both';

  return (
    <div className="space-y-16">
      {pages.map((page, pIdx) => (
        <div key={pIdx} className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 print-card print-break-before">
          <div className="bg-slate-800 text-white p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black">
                متابعة رصد الطلاب {isBoth ? '(الفترتين الشاملة)' : `(${period === 'أولى' ? 'الفترة الأولى' : 'الفترة الثانية'})`}
              </h3>
              <div className="flex items-center justify-center gap-4 mt-1">
                <span className="bg-blue-600 text-white px-4 py-0.5 rounded-full text-xs font-black shadow-lg">
                   {page.saf} - {page.fasel}
                </span>
                <span className="bg-slate-700 text-slate-300 px-3 py-0.5 rounded-full text-[10px] font-bold">
                   صفحة {page.page} من {page.totalPages}
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th rowSpan={isBoth ? 2 : 1} className="w-8 px-1 py-2 border border-slate-300 text-center text-[10px] font-black text-slate-600">م</th>
                  <th rowSpan={isBoth ? 2 : 1} className="w-48 px-2 py-2 border border-slate-300 text-[11px] font-black text-slate-600">اسم الطالب</th>
                  {page.subjects.map(s => (
                    <th key={s} colSpan={isBoth ? 2 : 1} className="px-1 py-1 border border-slate-300 text-center font-bold text-slate-700 bg-white min-w-[40px]">
                      <div className="text-[7px] leading-tight break-words whitespace-normal h-8 flex items-center justify-center text-center">
                        {s}
                      </div>
                    </th>
                  ))}
                </tr>
                {isBoth && (
                  <tr className="bg-slate-50 border-b-2 border-slate-300">
                    {page.subjects.map(s => (
                      <React.Fragment key={`${s}-sub`}>
                        <th className="px-0 py-1 border border-slate-300 text-center text-[8px] font-black text-blue-700 bg-blue-50/30">ف1</th>
                        <th className="px-0 py-1 border border-slate-300 text-center text-[8px] font-black text-purple-700 bg-purple-50/30">ف2</th>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {page.students.map((student, sIdx) => (
                  <tr key={student} className={`border-b border-slate-200 hover:bg-blue-50/30 transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                    <td className="px-1 py-1 text-center font-bold text-slate-400 border border-slate-200 text-[10px]">{page.startIdx + sIdx + 1}</td>
                    <td className="px-2 py-1 font-bold text-slate-800 border border-slate-200 text-[10px] truncate">{student}</td>
                    {page.subjects.map(subj => {
                      const isP1Recorded = page.p1Data[subj]?.studentRasidStatus[student];
                      const isP2Recorded = page.p2Data[subj]?.studentRasidStatus[student];
                      
                      if (isBoth) {
                        return (
                          <React.Fragment key={subj}>
                            <td className={`px-0 py-1 text-center border border-slate-200 ${isP1Recorded === undefined ? 'bg-slate-100/30' : ''}`}>
                              {isP1Recorded !== undefined && (
                                <div className={`w-2 h-2 mx-auto rounded-full ${isP1Recorded ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}></div>
                              )}
                            </td>
                            <td className={`px-0 py-1 text-center border border-slate-200 ${isP2Recorded === undefined ? 'bg-slate-100/30' : ''}`}>
                              {isP2Recorded !== undefined && (
                                <div className={`w-2 h-2 mx-auto rounded-full ${isP2Recorded ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}></div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      } else {
                        // عرض عمود واحد للفترة المختارة
                        const isRecorded = period === 'أولى' ? isP1Recorded : isP2Recorded;
                        return (
                          <td key={subj} className={`px-0 py-1 text-center border border-slate-200 ${isRecorded === undefined ? 'bg-slate-100/30' : ''}`}>
                            {isRecorded !== undefined && (
                              <div className={`w-2 h-2 mx-auto rounded-full ${isRecorded ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}></div>
                            )}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-bold">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> تم الرصد</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> لم يرصد</span>
            </div>
            <div>نظام رصد المواد - تقرير المتابعة الذكي</div>
            <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrackingTables;
