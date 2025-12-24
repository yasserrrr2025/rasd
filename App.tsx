
import React, { useState, useEffect } from 'react';
import { RasedSummary, TeacherMapping, Period } from './types';
import { processRasedFile, extractSummaryData, normalizeString } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
import TeachersReport from './components/TeachersReport';
import TrackingTables from './components/TrackingTables';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import PremiumReports from './components/PremiumReports';

const App: React.FC = () => {
  const [rasedSummary, setRasedSummary] = useState<RasedSummary>(() => {
    const saved = localStorage.getItem('rased_data');
    return saved ? JSON.parse(saved) : {};
  });
  const [teacherMapping, setTeacherMapping] = useState<TeacherMapping>(() => {
    const saved = localStorage.getItem('teacher_mapping');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('both');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isDragging, setIsDragging] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    localStorage.setItem('rased_data', JSON.stringify(rasedSummary));
  }, [rasedSummary]);

  useEffect(() => {
    localStorage.setItem('teacher_mapping', JSON.stringify(teacherMapping));
  }, [teacherMapping]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleRasedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
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

  const clearAllData = () => {
    if (window.confirm("سيتم حذف جميع البيانات المؤرشفة، هل أنت متأكد؟")) {
      setRasedSummary({});
      setTeacherMapping({});
      localStorage.clear();
    }
  };

  const hasData = Object.keys(rasedSummary).length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="max-w-[95%] mx-auto text-center py-10 px-4 no-print relative">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 left-4 p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 hover:scale-110 transition-all z-50">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 shadow-lg">الإصدار الاحترافي v2.5</div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight dark:text-white">نظام متابعة رصد المواد</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-bold max-w-2xl mx-auto mb-6">حل ذكي لإدارة ومتابعة رصد الدرجات في نظام نور</p>
        
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-full text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-md"
        >
          {showInstructions ? 'إخفاء التعليمات ▲' : 'كيف أحصل على الملفات؟ ▼'}
        </button>

        {showInstructions && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-right animate-in fade-in slide-in-from-top-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-600"></div>
              <h4 className="font-black text-blue-600 mb-6 flex items-center gap-3 text-lg">
                <span className="text-2xl">ℹ️</span> خطوات استخراج ملفات الرصد:
              </h4>
              <ol className="text-xs space-y-4 text-slate-600 dark:text-slate-400 font-bold">
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span> من نظام نور، توجه إلى قائمة "التقارير"</li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span> اختر "تقارير الدرجات"</li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span> اختر تقرير "متابعة رصد الفترات"</li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">4</span> حدد الصف والفصل الدراسي المطلوب</li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">5</span> اضغط على زر "عرض"</li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">6</span> يجب توفر إضافة "مدرستي بلس" لتحميل الملف</li>
                <li className="mt-2 mr-8">
                  <a href="https://chromewebstore.google.com/detail/%D9%85%D8%AF%D8%B1%D8%B3%D8%AA%D9%8A-%D8%A8%D9%84%D8%B3/mklbcllkgbfnhkfmmcmfghmjnjfomjff?hl=ar" target="_blank" rel="noreferrer" className="text-blue-500 underline text-[10px] hover:text-blue-700 transition-colors">تحميل الإضافة ➜</a>
                </li>
                <li className="flex gap-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0">7</span> حمل ملفات جميع الفصول واحفظها في مجلد واحد لسهولة الرفع</li>
              </ol>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-teal-500"></div>
              <h4 className="font-black text-teal-600 mb-6 flex items-center gap-3 text-lg">
                <span className="text-2xl">👨‍🏫</span> تنسيق ملف المعلمين (Excel):
              </h4>
              <p className="text-[10px] mb-6 text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">يجب أن يحتوي الملف على الأعمدة التالية بالترتيب (أو مع ترويسة واضحة):</p>
              
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-[9px] font-black text-center border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-2 border border-slate-200 dark:border-slate-700">اسم المعلم</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700">الصف</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700">المادة</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700">الفصل</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">خالد الشمري</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">أول متوسط</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">علوم</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">1</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/30">
                      <td className="p-2 border border-slate-200 dark:border-slate-700">نورة القحطاني</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">ثالث متوسط</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">لغة إنجليزية</td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700">3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[9px] text-amber-600 dark:text-amber-500 font-bold flex gap-2 items-start">
                <span className="text-lg">💡</span>
                * ملف المعلمين غير ضروري لتشغيل النظام، ولكنه مطلوب في حال أردت تفعيل ميزة "تقارير المعلمين المقصرين".
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Changed max-w-7xl to max-w-full with padding for edge-to-edge look */}
      <main className="max-w-[98%] mx-auto px-2 space-y-10 pb-20">
        <section 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleRasedFiles(e.dataTransfer.files); }}
          className={`no-print p-8 md:p-12 rounded-[3rem] shadow-2xl border-2 border-dashed transition-all duration-300 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400 scale-[1.01]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-black">
                <span className="bg-blue-600 p-2 rounded-xl text-white shadow-md">📁</span> رفع ملفات نور
              </label>
              <input type="file" multiple onChange={(e) => handleRasedFiles(e.target.files)} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white cursor-pointer bg-slate-50 dark:bg-slate-800 rounded-xl p-2" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-black">
                <span className="bg-teal-600 p-2 rounded-xl text-white shadow-md">👨‍🏫</span> ملف المعلمين (اختياري)
              </label>
              <input type="file" onChange={handleTeacherFile} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-teal-600 file:text-white cursor-pointer bg-slate-50 dark:bg-slate-800 rounded-xl p-2" />
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center items-center gap-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.8rem] shadow-inner">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500'}`}>{tab === 'dashboard' ? '📊 لوحة التحكم' : tab === 'analytics' ? '📈 التحليلات' : '📄 التقارير'}</button>
              ))}
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.8rem] shadow-inner">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-5 py-3 rounded-2xl font-black text-xs transition-all ${selectedPeriod === p ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500'}`}>{p === 'أولى' ? 'ف1' : p === 'ثانية' ? 'ف2' : 'شامل'}</button>
              ))}
            </div>
            <button onClick={clearAllData} className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-black text-xs hover:bg-rose-100 transition-all border border-rose-100">🗑️ مسح الأرشيف</button>
          </div>
        </section>

        {!hasData && !isProcessing && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl opacity-60 max-w-6xl mx-auto">
            <div className="text-6xl mb-6">📂</div>
            <h3 className="text-xl font-black mb-2">لا توجد بيانات حالياً</h3>
            <p className="text-sm font-bold text-slate-400">قم برفع ملفات الإكسل المستخرجة من نظام نور للبدء بالتحليل</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl max-w-6xl mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-6"></div>
            <p className="font-black text-xl">جاري معالجة البيانات بذكاء...</p>
          </div>
        )}

        {hasData && !isProcessing && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {activeTab === 'dashboard' && (
              <div className="space-y-16">
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </div>
            )}
            {activeTab === 'analytics' && <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            {activeTab === 'reports' && (
               <div className="space-y-16 max-w-7xl mx-auto">
                <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
               </div>
            )}
          </div>
        )}
      </main>
      <footer className="max-w-6xl mx-auto mt-20 pb-16 text-center no-print border-t border-slate-100 dark:border-slate-800">
        <div className="pt-12 flex flex-col items-center gap-4">
          <p className="text-slate-700 dark:text-slate-300 text-xl font-bold">
            تم التطوير بواسطة <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">ياسر الهذلي</span>
          </p>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">لتسهيل العمل الإداري المدرسي • 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
