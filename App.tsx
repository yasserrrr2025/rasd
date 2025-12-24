
import React, { useState, useMemo } from 'react';
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
    alert("تم رفع ومعالجة ملفات الرصد بنجاح للفترات المتاحة!");
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
      alert("تم رفع ملف المعلمين بنجاح!");
    };
    reader.readAsArrayBuffer(file);
  };

  const printReport = () => {
    window.print();
  };

  const periodLabel = selectedPeriod === 'أولى' ? 'الفترة الأولى' : selectedPeriod === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الأولى والثانية';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <header className="max-w-6xl mx-auto text-center mb-10 no-print">
        <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">نظام رصد المواد المتطور</h1>
        <div className="h-1.5 w-32 bg-blue-600 mx-auto rounded-full mb-4"></div>
        <p className="text-slate-500 text-lg font-semibold">تحليل ومتابعة دقيقة لنتائج الطلاب للفترات الدراسية</p>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* قسم رفع الملفات واختيار الفترة */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-slate-100 no-print transition-all hover:shadow-blue-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mr-2">
                <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">📁</span>
                ملفات الرصد (يمكنك اختيار ملفات متعددة للفترتين):
              </label>
              <input 
                type="file" 
                multiple 
                onChange={handleRasedFiles}
                className="block w-full text-sm text-slate-500 file:ml-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mr-2">
                <span className="bg-teal-100 p-1.5 rounded-lg text-teal-600">👨‍🏫</span>
                ملف المعلمين (اختياري لربط المواد بالأسماء):
              </label>
              <input 
                type="file" 
                onChange={handleTeacherFile}
                className="block w-full text-sm text-slate-500 file:ml-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 transition-all cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center space-y-8 border-t border-slate-100 pt-8">
            <div className="flex flex-col items-center space-y-4">
              <span className="text-slate-600 font-bold">اختر الفترة المراد عرضها في التقارير:</span>
              <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
                <button 
                  onClick={() => setSelectedPeriod('أولى')}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${selectedPeriod === 'أولى' ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >الفترة الأولى</button>
                <button 
                  onClick={() => setSelectedPeriod('ثانية')}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${selectedPeriod === 'ثانية' ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >الفترة الثانية</button>
                <button 
                  onClick={() => setSelectedPeriod('both')}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${selectedPeriod === 'both' ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >الفترتين معاً</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={() => setShowResults(true)}
                disabled={Object.keys(rasedSummary).length === 0}
                className="group relative bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-200 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>🚀</span> عرض الملخص النهائي ({periodLabel})
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
              <button 
                onClick={printReport}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2"
              >
                <span>🖨️</span> طباعة التقرير الشامل
              </button>
            </div>
          </div>
        </section>

        {isProcessing && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-xl animate-pulse">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-slate-700 text-xl font-black">جاري تحليل البيانات واستخراج النتائج...</p>
          </div>
        )}

        {showResults && !isProcessing && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Dashboard 
              rasedSummary={rasedSummary} 
              teacherMapping={teacherMapping} 
              period={selectedPeriod} 
            />
            
            <TeachersReport 
              rasedSummary={rasedSummary} 
              teacherMapping={teacherMapping} 
              period={selectedPeriod} 
            />

            <SummaryTables 
              rasedSummary={rasedSummary} 
              teacherMapping={teacherMapping} 
              period={selectedPeriod} 
            />

            <TrackingTables 
              rasedSummary={rasedSummary} 
              period={selectedPeriod} 
            />
          </div>
        )}
      </main>

      <footer className="mt-20 text-center text-slate-400 pb-10 no-print border-t border-slate-200 pt-8 max-w-6xl mx-auto">
        <p className="font-bold">© {new Date().getFullYear()} نظام رصد المواد المتطور | دقة في الأداء وسهولة في التحليل</p>
      </footer>
    </div>
  );
};

export default App;
