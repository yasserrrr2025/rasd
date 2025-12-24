
import React from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

interface DashboardProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const Dashboard: React.FC<DashboardProps> = ({ rasedSummary, teacherMapping, period }) => {
  const stats = React.useMemo(() => {
    let totalRasid = 0;
    let totalLamRasid = 0;
    let studentsSet = new Set<string>();
    let subjectsSet = new Set<string>();
    let teachersSet = new Set<string>();
    let classesCount = 0;

    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        classesCount++;
        targetPeriods.forEach(p => {
          const periodData = rasedSummary[saf][fasel][p];
          if (!periodData) return;

          for (const subject in periodData) {
            const data = periodData[subject];
            subjectsSet.add(subject);
            totalRasid += data.rasidCount;
            totalLamRasid += data.lamRasidCount;
            data.studentsList.forEach(s => studentsSet.add(`${saf}-${fasel}-${s}`));
            
            const teachers = teacherMapping[saf]?.[fasel]?.[subject] || [];
            teachers.forEach(t => teachersSet.add(t));
          }
        });
      }
    }

    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";

    return {
      totalRasid,
      totalLamRasid,
      total,
      percentage,
      studentCount: studentsSet.size,
      subjectCount: subjectsSet.size,
      teacherCount: teachersSet.size,
      classesCount
    };
  }, [rasedSummary, teacherMapping, period]);

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الأولى والثانية';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center print-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 text-center md:text-right">
          <h2 className="text-3xl font-black mb-2">إحصائية الرصد العامة</h2>
          <p className="text-blue-400 font-bold text-lg uppercase tracking-widest">{periodLabel}</p>
        </div>
        <div className="relative z-10 flex items-center gap-10 mt-6 md:mt-0">
          <div className="text-center group">
            <div className="relative inline-block">
              <span className="block text-6xl font-black text-blue-400 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">{stats.percentage}%</span>
              <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-blue-400/30 rounded-full"></div>
            </div>
            <span className="block mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">إجمالي نسبة الإنجاز</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلاب" value={stats.studentCount} icon="🎓" color="blue" />
        <StatCard title="إجمالي المعلمين" value={stats.teacherCount} icon="👨‍🏫" color="emerald" />
        <StatCard title="المواد المدروسة" value={stats.subjectCount} icon="📚" color="amber" />
        <StatCard title="الفصول الدراسية" value={stats.classesCount} icon="🏫" color="indigo" />
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 print-card">
        <h3 className="text-xl font-black text-slate-800 mb-8 text-center flex items-center justify-center gap-3">
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          تقدم الرصد والتحليل التفصيلي
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
        </h3>
        <div className="relative pt-1 max-w-3xl mx-auto">
          <div className="flex mb-4 items-center justify-between font-black text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-600 uppercase">تم الرصد بنجاح: {stats.totalRasid}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-rose-600 uppercase">لم يتم الرصد بعد: {stats.totalLamRasid}</span>
              <span className="inline-block w-3 h-3 rounded-full bg-rose-500"></span>
            </div>
          </div>
          <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-full bg-slate-100 shadow-inner border border-slate-200">
            <div 
              style={{ width: `${stats.percentage}%` }} 
              className="shadow-xl flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 ease-out"
            >
              <span className="font-black drop-shadow-md">{stats.percentage}%</span>
            </div>
          </div>
          <p className="text-center text-slate-400 text-xs font-bold mt-4">
            يتم احتساب النسبة بناءً على عدد الطلاب والدروس المرصودة مقارنة بالإجمالي الكلي للفترة المختارة
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 shadow-blue-100',
    emerald: 'bg-emerald-100 text-emerald-600 shadow-emerald-100',
    amber: 'bg-amber-100 text-amber-600 shadow-amber-100',
    indigo: 'bg-indigo-100 text-indigo-600 shadow-indigo-100',
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-50 flex items-center gap-6 hover:translate-y-[-5px] transition-all duration-300 print-card group">
      <div className={`text-4xl p-5 rounded-[1.5rem] transition-transform group-hover:rotate-12 ${colorClasses[color]}`}>{icon}</div>
      <div>
        <span className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-1">{title}</span>
        <span className="text-3xl font-black text-slate-800 tabular-nums">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
