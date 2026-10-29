import React, { useState } from 'react';
import { RasedSummary, TeacherMapping, Period, StudentGuidanceMap } from './types';
import { processRasedFile, extractSummaryData, normalizeString, processStudentGuidanceFile } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
import TeachersReport from './components/TeachersReport';
import TrackingTables from './components/TrackingTables';

interface RawRasedData {
  saf: string;
  fasel: string;
  data: any[][];
}

const App: React.FC = () => {
  const [rasedSummary, setRasedSummary] = useState<RasedSummary>({});
  const [teacherMapping, setTeacherMapping] = useState<TeacherMapping>({});
  const [guidanceMap, setGuidanceMap] = useState<StudentGuidanceMap | null>(null);
  const [rawRasedList, setRawRasedList] = useState<RawRasedData[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('both');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNoorGuide, setShowNoorGuide] = useState(false);
  const [showGuidanceGuide, setShowGuidanceGuide] = useState(false);
  const [showTeacherGuide, setShowTeacherGuide] = useState(false);

  const hasTeachers = Object.keys(teacherMapping).length > 0;
  const teacherCount = Object.values(teacherMapping).reduce((acc, safMap) => {
    return acc + Object.values(safMap).reduce((acc2, fMap) => {
      const set = new Set<string>();
      Object.values(fMap).forEach(list => list.forEach(t => set.add(t)));
      return acc2 + set.size;
    }, 0);
  }, 0);

  // دالة إعادة تجميع البيانات عند توفر أو تغيير ملف الإرشاد الطلابي
  const recomputeSummary = (filesData: RawRasedData[], gMap: StudentGuidanceMap | null) => {
    let summary: RasedSummary = {};
    for (const item of filesData) {
      summary = extractSummaryData(item.data, summary, gMap, item.saf, item.fasel);
    }
    setRasedSummary(summary);
  };

  const handleRasedFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newRawList: RawRasedData[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const res = await processRasedFile(files[i]);
        newRawList.push(res);
      } catch (err) {
        console.error("Error processing file:", files[i].name, err);
      }
    }

    setRawRasedList(newRawList);
    recomputeSummary(newRawList, guidanceMap);
    setIsProcessing(false);
    setShowResults(true);
  };

  const handleGuidanceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const gMap = await processStudentGuidanceFile(file);
      setGuidanceMap(gMap);
      if (rawRasedList.length > 0) {
        recomputeSummary(rawRasedList, gMap);
      }
    } catch (err) {
      console.error("Error processing student guidance file:", err);
      alert("حدث خطأ أثناء قراءة ملف الإرشاد الطلابي، يرجى التأكد من صيغة الملف.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTeacherFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const mapping: TeacherMapping = {};
        jsonData.slice(1).forEach(row => {
          if (row.length < 4) return;
          const teacher = normalizeString(row[0]);
          let saf = normalizeString(row[1]);
          const subject = normalizeString(row[2]);
          const fasel = normalizeString(row[3]);

          if (saf.includes("اول") || saf.includes("أول")) saf = "الأول المتوسط";
          else if (saf.includes("ثاني") || saf.includes("ثان")) saf = "الثاني المتوسط";
          else if (saf.includes("ثالث")) saf = "الثالث المتوسط";

          if (!mapping[saf]) mapping[saf] = {};
          if (!mapping[saf][fasel]) mapping[saf][fasel] = {};
          if (!mapping[saf][fasel][subject]) mapping[saf][fasel][subject] = [];
          if (!mapping[saf][fasel][subject].includes(teacher)) {
            mapping[saf][fasel][subject].push(teacher);
          }
        });

        setTeacherMapping(mapping);
      } catch (err) {
        console.error("Error reading teacher file:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const printReport = () => window.print();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <header className="max-w-6xl mx-auto text-center mb-12 no-print">
        <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-blue-200">الإصدار المطور 2025</div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">نظام متابعة رصد المواد</h1>
        <div className="h-1.5 w-40 bg-blue-600 mx-auto rounded-full mb-6"></div>
        <p className="text-slate-500 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">أداة احترافية لمتابعة رصد درجات الطلاب في نظام نور بدقة وسهولة</p>
      </header>

      <main className="max-w-6xl mx-auto space-y-10">
        <section className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Noor Files Input */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <span className="bg-blue-600 p-2 rounded-xl text-white shadow-md text-xs">📁</span>
                    ملفات رصد نور
                  </label>
                  <button 
                    onClick={() => { setShowNoorGuide(!showNoorGuide); setShowGuidanceGuide(false); setShowTeacherGuide(false); }}
                    className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    {showNoorGuide ? "إغلاق" : "كيف تحصل عليه؟"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 font-semibold leading-relaxed">
                  يقبل ملفات الفصول المفردة أو ملف "الكل" الشامل للصف كاملاً.
                </p>
              </div>
              <div>
                <input 
                  type="file" 
                  multiple 
                  accept=".xlsx, .xls"
                  onChange={handleRasedFiles}
                  className="block w-full text-[11px] text-slate-500 file:ml-2 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer bg-white rounded-xl p-1.5 border border-slate-200"
                />
                {rawRasedList.length > 0 && (
                  <div className="mt-2 text-[10px] font-black text-blue-600 flex items-center gap-1">
                    <span>✓</span> تم تحميل {rawRasedList.length} ملف رصد
                  </div>
                )}
              </div>
            </div>

            {/* 2. Student Guidance File Input (NEW) */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <span className="bg-emerald-600 p-2 rounded-xl text-white shadow-md text-xs">📋</span>
                    ملف أسماء الطلاب (اختياري)
                  </label>
                  <button 
                    onClick={() => { setShowGuidanceGuide(!showGuidanceGuide); setShowNoorGuide(false); setShowTeacherGuide(false); }}
                    className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-black hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    {showGuidanceGuide ? "إغلاق" : "طريقة الاستخراج؟"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 font-semibold leading-relaxed">
                  يوزع طلاب ملف "الكل" تلقائياً على فصولهم (1، 2، 3...) لتمكين ربط المعلمين.
                </p>
              </div>
              <div>
                <input 
                  type="file" 
                  accept=".xls, .xlsx"
                  onChange={handleGuidanceFile}
                  className="block w-full text-[11px] text-slate-500 file:ml-2 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition-all cursor-pointer bg-white rounded-xl p-1.5 border border-slate-200"
                />
                {guidanceMap && (
                  <div className="mt-2 text-[10px] font-black text-emerald-600 flex items-center gap-1">
                    <span>✓</span> تم تحميل بيانات {guidanceMap.totalStudents} طالباً
                  </div>
                )}
              </div>
            </div>
            
            {/* 3. Teacher File Input */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <span className="bg-teal-600 p-2 rounded-xl text-white shadow-md text-xs">👨‍🏫</span>
                    ملف المعلمين (اختياري)
                  </label>
                  <button 
                    onClick={() => { setShowTeacherGuide(!showTeacherGuide); setShowNoorGuide(false); setShowGuidanceGuide(false); }}
                    className="text-[10px] bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full font-black hover:bg-teal-100 transition-all border border-teal-100"
                  >
                    {showTeacherGuide ? "إغلاق" : "تنسيق الملف؟"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 font-semibold leading-relaxed">
                  يربط المواد والفصول بأسماء المعلمين لتوليد تقارير النواقص لكل معلم.
                </p>
              </div>
              <div>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleTeacherFile}
                  className="block w-full text-[11px] text-slate-500 file:ml-2 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-teal-600 file:text-white hover:file:bg-teal-700 transition-all cursor-pointer bg-white rounded-xl p-1.5 border border-slate-200"
                />
                {hasTeachers && (
                  <div className="mt-2 text-[10px] font-black text-teal-600 flex items-center gap-1">
                    <span>✓</span> تم ربط {teacherCount} معلماً
                  </div>
                )}
              </div>
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
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">4</span> حدد الصف والفصل الدراسي (أو اختر "الكل" لتحميل الصف دفعة واحدة)</li>
                </ul>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">5</span> اضغط على زر "عرض"</li>
                  <li className="flex gap-3 items-start text-amber-400">
                    <span className="bg-amber-400/20 text-amber-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">6</span> 
                    يجب توفر إضافة "مدرستي بلس" لتحميل الملف بصيغة Excel
                    <a href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" target="_blank" rel="noreferrer" className="inline-block bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] text-white underline mr-2">تحميل الإضافة ➜</a>
                  </li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">7</span> حمل ملفات الفصول أو ملف "الكل" وارفعها هنا مباشرة</li>
                </ul>
              </div>
            </div>
          )}

          {/* Guidance Guide Section (NEW) */}
          {showGuidanceGuide && (
            <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white animate-in slide-in-from-top duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mt-32 blur-3xl"></div>
              <h4 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                <span className="bg-emerald-600 p-2 rounded-xl">📋</span> 
                خطوات استخراج ملف الإرشاد الطلابي من نظام نور:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm font-bold">
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">1</span> من القائمة الرئيسية في نظام نور، اختر <strong>"التقارير"</strong></li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">2</span> من قائمة التقارير، اختر <strong>"التقارير الإحصائية"</strong></li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">3</span> اختر تقرير <strong>"ملفات الإرشاد الطلابي"</strong></li>
                  <li className="flex gap-3 items-start"><span className="bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">4</span> صدّر الملف بصيغة Excel (ملف StudentGuidance.xls)</li>
                </ul>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col justify-center space-y-3">
                  <div className="text-emerald-400 text-xs font-black flex items-center gap-2">
                    <span>💡</span> لماذا هذا الملف مفيد؟
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    عند تصدير كشف متابعة الرصد من نور بخيار <strong>"الكل"</strong>، يحتوي الملف على جميع طلاب المرحلة مدمجين دون تحديد رقم الفصل لكل طالب. ملف الإرشاد الطلابي يتعرف فورياً على هوية كل طالب ويوزعه آلياً على فصله الصحيح (1، 2، 3...)، مما يتيح ربط المعلمين وتوليد تقارير دقيقة لكل معلم وفصل.
                  </p>
                </div>
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

          {/* Periods Selection & Actions */}
          <div className="mt-12 flex flex-col items-center space-y-10 border-t border-slate-100 pt-10">
            <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-[1.8rem] shadow-inner justify-center">
              {(['أولى', 'ثانية', 'نهاية فصل', 'both'] as const).map(p => (
                <button 
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-6 md:px-10 py-3 rounded-2xl font-black transition-all duration-300 text-xs md:text-sm ${
                    selectedPeriod === p ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === 'أولى' ? 'الفترة الأولى' : p === 'ثانية' ? 'الفترة الثانية' : p === 'نهاية فصل' ? 'نهاية الفصل' : 'جميع الفترات'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 justify-center">
              {/* استعراض التقرير التفصيلي */}
              <button 
                onClick={() => setShowResults(true)}
                disabled={Object.keys(rasedSummary).length === 0}
                className="group relative px-12 py-5 rounded-[2rem] font-black text-white transition-all duration-300 
                           bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700
                           hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.6)] 
                           hover:-translate-y-1.5 hover:scale-[1.02]
                           active:scale-95 active:translate-y-0
                           disabled:opacity-40 disabled:pointer-events-none 
                           flex items-center gap-4 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="text-2xl group-hover:rotate-12 transition-transform">🚀</span>
                <span className="relative tracking-tight text-lg">استعراض التقرير التفصيلي</span>
              </button>

              {/* طباعة النتائج */}
              <button 
                onClick={printReport}
                disabled={Object.keys(rasedSummary).length === 0}
                className="group px-12 py-5 rounded-[2rem] font-black text-white transition-all duration-300
                           bg-slate-900 border border-slate-800
                           hover:bg-black hover:shadow-[0_15px_40px_-10px_rgba(15,23,42,0.4)]
                           hover:-translate-y-1.5 hover:scale-[1.02]
                           active:scale-95 active:translate-y-0
                           disabled:opacity-40 disabled:pointer-events-none
                           flex items-center gap-4 shadow-xl cursor-pointer"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🖨️</span>
                <span className="tracking-tight text-lg">طباعة النتائج</span>
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

      <footer className="max-w-6xl mx-auto mt-32 pb-16 text-center no-print relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="pt-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-[1.2rem] shadow-2xl flex items-center justify-center border border-slate-50 mb-2 transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <span className="text-2xl">✨</span>
          </div>
          <p className="text-slate-700 text-xl font-bold tracking-tight">
            نظام متابعة رصد المواد المطور
          </p>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-slate-200"></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              لتسهيل العمل الإداري المدرسي • 2025
            </p>
            <div className="h-px w-8 bg-slate-200"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
