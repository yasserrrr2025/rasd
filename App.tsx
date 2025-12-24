
import React, { useState } from 'react';
import { RasedSummary, TeacherMapping, Period } from './types';
import { processRasedFile, extractSummaryData, normalizeString } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
import TeachersReport from './components/TeachersReport';
import TrackingTables from './components/TrackingTables';

const App: React.FC = () => {
  const [rasedSummary, setRasedSummary] = useState<RasedSummary>({});
  const [teacherMapping, setTeacherMapping] = useState<TeacherMapping>({});
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('both');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNoorGuide, setShowNoorGuide] = useState(false);
  const [showTeacherGuide, setShowTeacherGuide] = useState(false);

  const hasTeachers = Object.keys(teacherMapping).length > 0;

  const handleRasedFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    let updatedSummary = { ...rasedSummary };

    for (let i = 0; i < files.length; i++) {
      try {
        const { data } = await processRasedFile(files[i]);
        updatedSummary = extractSummaryData(data, updatedSummary);
      } catch (err) {
        console.error("Error processing file:", files[i].name, err);
      }
    }

    setRasedSummary(updatedSummary);
    setIsProcessing(false);
  };

  const handleTeacherFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      const mapping: TeacherMapping = {};
      jsonData.slice(1).forEach(row => {
        if (row.length < 4) return;
        const teacher = normalizeString(row[0]);
        const saf = normalizeString(row[1]);
        const subject = normalizeString(row[2]);
        const fasel = normalizeString(row[3]);

        if (!mapping[saf]) mapping[saf] = {};
        if (!mapping[saf][fasel]) mapping[saf][fasel] = {};
        if (!mapping[saf][fasel][subject]) mapping[saf][fasel][subject] = [];
        mapping[saf][fasel][subject].push(teacher);
      });

      setTeacherMapping(mapping);
    };
    reader.readAsArrayBuffer(file);
  };

  const printReport = () => window.print();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <header className="max-w-6xl mx-auto text-center mb-12 no-print">
        <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-blue-200">الإصدار المطور 2025</div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">نظام رصد المواد الذكي</h1>
        <div className="h-1.5 w-40 bg-blue-600 mx-auto rounded-full mb-6"></div>
        <p className="text-slate-500 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">أداة احترافية لتحليل ومتابعة رصد درجات الطلاب في نظام نور بدقة وسهولة</p>
      </header>

      <main className="max-w-6xl mx-auto space-y-10">
        <section className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Noor Files Input */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <span className="bg-blue-600 p-2 rounded-xl text-white shadow-md">📁</span>
                  ملفات رصد نور (Excel)
                </label>
                <button 
                  onClick={() => { setShowNoorGuide(!showNoorGuide); setShowTeacherGuide(false); }}
                  className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-black hover:bg-blue-100 transition-all border border-blue-100"
                >
                  {showNoorGuide ? "إغلاق الدليل" : "كيف تحصل على الملفات؟"}
                </button>
              </div>
              <input 
                type="file" 
                multiple 
                onChange={handleRasedFiles}
                className="block w-full text-xs text-slate-500 file:ml-4 file:py-3.5 file:px-8 file:rounded-2xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200"
              />
            </div>
            
            {/* Teacher File Input */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <span className="bg-teal-600 p-2 rounded-xl text-white shadow-md">👨‍🏫</span>
                  ملف المعلمين (اختياري)
                </label>
                <button 
                  onClick={() => { setShowTeacherGuide(!showTeacherGuide); setShowNoorGuide(false); }}
                  className="text-[10px] bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full font-black hover:bg-teal-100 transition-all border border-teal-100"
                >
                  {showTeacherGuide ? "إخفاء الدليل" : "شكل ملف المعلم؟"}
                </button>
              </div>
              <input 
                type="file" 
                onChange={handleTeacherFile}
                className="block w-full text-xs text-slate-500 file:ml-4 file:py-3.5 file:px-8 file:rounded-2xl file:border-0 file:text-xs file:font-black file:bg-teal-600 file:text-white hover:file:bg-teal-700 transition-all cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200"
              />
            </div>
          </div>

          {/* Noor Guide Section */}
          {showNoorGuide && (
            <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white animate-in slide-in-from-top duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mt-32 blur-3xl"></div>
              <h4 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                <span className="bg-blue-600 p-2 rounded-xl">ℹ️</span> 
                خطوات استخراج ملفات الرصد من نظام نور:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm font-bold">
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">1</span> من نظام نور، توجه إلى قائمة "التقارير"</li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">2</span> اختر "تقارير الدرجات"</li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">3</span> اختر تقرير "متابعة رصد الفترات"</li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">4</span> حدد الصف والفصل الدراسي المطلوب</li>
                </ul>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">5</span> اضغط على زر "عرض"</li>
                  <li className="flex gap-3 items-start text-amber-400">
                    <span className="bg-amber-400/20 text-amber-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">6</span> 
                    يجب توفر إضافة "مدرستي بلس" لتحميل الملف
                    <a href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" target="_blank" rel="noreferrer" className="inline-block bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] text-white underline mr-2">تحميل الإضافة ➜</a>
                  </li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">7</span> حمل ملفات جميع الفصول واحفظها في مجلد واحد لسهولة الرفع</li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400 font-bold flex items-center gap-2">
                <span className="text-blue-500">💡 نصيحة:</span> عند اختيار الملفات من جهازك، يمكنك تظليل جميع الملفات ورفعها دفعة واحدة.
              </div>
            </div>
          )}

          {/* Teacher Guide Section */}
          {showTeacherGuide && (
            <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white animate-in slide-in-from-top duration-500 relative overflow-hidden">
              <h4 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                <span className="bg-teal-600 p-2 rounded-xl">👨‍🏫</span> 
                تنسيق ملف المعلمين المطلوب (Excel):
              </h4>
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-center text-[10px] border-collapse bg-white/5 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="p-3 border-l border-white/10">اسم المعلم</th>
                      <th className="p-3 border-l border-white/10">الصف</th>
                      <th className="p-3 border-l border-white/10">المادة</th>
                      <th className="p-3">الفصل</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-white/5">
                      <td className="p-3 border-l border-white/10">خالد الشمري</td>
                      <td className="p-3 border-l border-white/10">أول متوسط</td>
                      <td className="p-3 border-l border-white/10">علوم</td>
                      <td className="p-3">1</td>
                    </tr>
                    <tr className="border-t border-white/5">
                      <td className="p-3 border-l border-white/10">نورة القحطاني</td>
                      <td className="p-3 border-l border-white/10">ثالث متوسط</td>
                      <td className="p-3 border-l border-white/10">لغة إنجليزية</td>
                      <td className="p-3">3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[10px] text-slate-400 font-bold leading-relaxed">
                * ملف المعلمين غير ضروري لتشغيل النظام، ولكنه مطلوب في حال أردت تفعيل ميزة "تقارير المعلمين المقصرين".
              </p>
            </div>
          )}

          <div className="mt-12 flex flex-col items-center space-y-10 border-t border-slate-100 pt-10">
            <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] shadow-inner">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button 
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-8 md:px-12 py-3.5 rounded-2xl font-black transition-all duration-300 text-sm ${selectedPeriod === p ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {p === 'أولى' ? 'الفترة الأولى' : p === 'ثانية' ? 'الفترة الثانية' : 'الفترتين معاً'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-5 justify-center">
              <button 
                onClick={() => setShowResults(true)}
                disabled={Object.keys(rasedSummary).length === 0}
                className="group relative bg-blue-600 text-white px-12 py-4.5 rounded-[1.5rem] font-black hover:bg-blue-700 disabled:opacity-40 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3"
              >
                🚀 استعراض التقرير التفصيلي
              </button>
              <button onClick={printReport} className="bg-slate-900 text-white px-12 py-4.5 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3">
                🖨️ طباعة النتائج
              </button>
            </div>
          </div>
        </section>

        {isProcessing && (
          <div className="text-center py-24 bg-white rounded-[3rem] shadow-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 border-r-4 border-r-blue-100 mx-auto mb-8"></div>
            <p className="text-slate-900 text-2xl font-black">جاري تحليل البيانات بذكاء...</p>
            <p className="text-slate-400 mt-2 font-bold">يرجى الانتظار قليلاً لمعالجة ملفات نور</p>
          </div>
        )}

        {showResults && !isProcessing && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
            {hasTeachers && <TeachersReport rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
            <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pb-10 text-center no-print">
         <div className="h-px bg-slate-200 w-full mb-8"></div>
         <p className="text-slate-400 text-xs font-black uppercase tracking-widest">تم التطوير لتسهيل العمل الإداري المدرسي • 2025</p>
      </footer>
    </div>
  );
};

export default App;
