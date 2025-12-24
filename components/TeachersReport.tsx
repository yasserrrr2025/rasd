
import React from 'react';
import { RasedSummary, TeacherMapping, Period, TeacherStat } from '../types';

interface TeachersReportProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const TeachersReport: React.FC<TeachersReportProps> = ({ rasedSummary, teacherMapping, period }) => {
  const reportData = React.useMemo(() => {
    const stats: Record<string, { lam: number; rasid: number }> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;

          for (const subject in pData) {
            const data = pData[subject];
            if (data.lamRasidCount > 0) {
              const teachers = teacherMapping[saf]?.[fasel]?.[subject] || ["لا يوجد معلم"];
              teachers.forEach(t => {
                if (!stats[t]) stats[t] = { lam: 0, rasid: 0 };
                stats[t].lam += data.lamRasidCount;
                stats[t].rasid += data.rasidCount;
              });
            }
          }
        });
      }
    }

    return Object.entries(stats)
      .map(([teacher, counts]): TeacherStat => {
        const total = counts.lam + counts.rasid;
        return {
          teacher,
          lamRasidCount: counts.lam,
          rasidCount: counts.rasid,
          percentage: Number(((counts.lam / total) * 100).toFixed(2))
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [rasedSummary, teacherMapping, period]);

  if (reportData.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 print-card print-break-before">
      <div className="bg-rose-600 text-white p-6 text-center">
        <h3 className="text-xl font-bold">معلمون لم يكملوا رصد الدرجات ({period === 'both' ? 'الفترتين' : period})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-rose-50 border-b border-rose-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-rose-800">م</th>
              <th className="px-6 py-4 text-sm font-bold text-rose-800">اسم المعلم</th>
              <th className="px-6 py-4 text-sm font-bold text-rose-800">طلاب لم ترصد درجاتهم</th>
              <th className="px-6 py-4 text-sm font-bold text-rose-800">نسبة عدم الرصد</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((stat, idx) => (
              <tr key={stat.teacher} className="border-b border-rose-50 hover:bg-rose-50 transition-colors">
                <td className="px-6 py-4 text-slate-500 font-bold">{idx + 1}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{stat.teacher}</td>
                <td className="px-6 py-4 text-rose-600 font-bold">{stat.lamRasidCount}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">{stat.percentage}%</span>
                    <div className="flex-1 h-2 bg-rose-100 rounded-full overflow-hidden w-24">
                      <div className="h-full bg-rose-500" style={{ width: `${stat.percentage}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeachersReport;
