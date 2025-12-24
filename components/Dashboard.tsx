
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
    let classesList: any[] = [];

    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        let classRasid = 0;
        let classTotal = 0;

        targetPeriods.forEach(p => {
          const periodData = rasedSummary[saf][fasel][p];
          if (!periodData) return;

          for (const subject in periodData) {
            const data = periodData[subject];
            subjectsSet.add(subject);
            totalRasid += data.rasidCount;
            totalLamRasid += data.lamRasidCount;
            classRasid += data.rasidCount;
            classTotal += (data.rasidCount + data.lamRasidCount);
            
            data.studentsList.forEach(s => studentsSet.add(`${saf}-${fasel}-${s}`));
            const teachers = teacherMapping[saf]?.[fasel]?.[subject] || [];
            teachers.forEach(t => teachersSet.add(t));
          }
        });

        if (classTotal > 0) {
          classesList.push({
            name: `${saf} - ${fasel}`,
            percentage: Number(((classRasid / classTotal) * 100).toFixed(1)),
            rasid: classRasid,
            total: classTotal
          });
        }
      }
    }

    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";

    // ترتيب الفصول تنازلياً حسب نسبة الرصد
    classesList.sort((a, b) => b.percentage - a.percentage);

    return {
      totalRasid,
      totalLamRasid,
      total,
      percentage,
      studentCount: studentsSet.size,
      subjectCount: subjectsSet.size,
      teacherCount: teachersSet.size,
      classesCount: classesList.length,
      classesList
    };
  }, [rasedSummary, teacherMapping, period]);

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الأولى والثانية الشاملة';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Hero Stats Card */}
      <div className="bg-slate-900 text-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center print-card overflow-hidden relative border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-600/10 rounded-full blur-[80px] -ml-30 -mb-30"></div>
        
        <div className="relative z-10 text-center md:text-right">
          <div className="inline-block bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-4 tracking-widest border border-white/10">التقرير العام للمدرسة</div>
          <h2 className="text-4xl font-black mb-2">إحصائية الرصد الكلية</h2>
          <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">{periodLabel}</p>
        </div>

        <div className="relative z-10 text-center mt-8 md:mt-0">
          <div className="relative inline-block">
            <span className="block text-7xl md:text-8xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">{stats.percentage}%</span>
            <div className="absolute -top-4 -right-4 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <span className="block mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">نسبة اكتمال رصد الدرجات</span>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلاب" value={stats.studentCount} icon="🎓" color="blue" />
        <StatCard title="المواد الدراسية" value={stats.subjectCount} icon="📚" color="amber" />
        <StatCard title="الفصول" value={stats.classesCount} icon="🏫" color="indigo" />
        <StatCard title="الهيئة التعليمية" value={stats.teacherCount || "---"} icon="👨‍🏫" color="emerald" />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard - الفصول الأكثر إنجازاً */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 print-card">
          <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3">
            <span className="bg-amber-100 p-2.5 rounded-2xl text-xl shadow-inner">🏆</span> ترتيب الفصول حسب نسبة الرصد
          </h3>
          <div className="space-y-7">
            {stats.classesList.map((cls, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2.5 px-1">
                  <div className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${idx < 3 ? 'bg-amber-100 text-amber-600 scale-110 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-black text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black text-slate-300 tabular-nums">({cls.rasid} من {cls.total})</span>
                     <span className={`text-xs font-black tabular-nums ${cls.percentage === 100 ? 'text-emerald-500' : 'text-slate-600'}`}>
                       {cls.percentage}%
                     </span>
                  </div>
                </div>
                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-50">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${cls.percentage === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : cls.percentage >= 75 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-rose-400'}`}
                    style={{ width: `${cls.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary Card */}
        <div className="bg-slate-50 p-10 rounded-[3rem] shadow-inner border border-slate-100 flex flex-col justify-center items-center text-center space-y-10 print-card">
          <div className="w-full">
            <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-sm">✓</div>
            <span className="block text-5xl font-black text-emerald-600 tabular-nums">{stats.totalRasid}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">درجة مكتملة الرصد</span>
          </div>
          <div className="h-px bg-slate-200 w-32"></div>
          <div className="w-full">
            <div className="bg-rose-100 text-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-sm">!</div>
            <span className="block text-5xl font-black text-rose-500 tabular-nums">{stats.totalLamRasid}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">درجة متبقية في الانتظار</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-lg border border-slate-50 flex items-center gap-6 print-card transition-all hover:-translate-y-2 hover:shadow-2xl">
      <div className={`text-4xl p-5 rounded-3xl ${colors[color]} shadow-inner`}>{icon}</div>
      <div>
        <span className="block text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">{title}</span>
        <span className="text-3xl font-black text-slate-800 tabular-nums leading-none">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
