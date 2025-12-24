
import * as XLSX from 'xlsx';
import { RasedSummary, SubjectData } from '../types';

export const normalizeString = (str: any): string => {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/\u00A0/g, " ").trim();
};

export const processRasedFile = async (file: File): Promise<{ saf: string; fasel: string; data: any[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const saf = normalizeString(jsonData[2]?.[1] || "غير معروف");
        const fasel = normalizeString(jsonData[8]?.[1] || "غير معروف");
        
        resolve({ saf, fasel, data: jsonData });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const extractSummaryData = (data: any[][], currentSummary: RasedSummary): RasedSummary => {
  if (data.length < 21) return currentSummary;

  const headersRaw = data[19];
  const firstDataRow = data[20]; // صف 21 في إكسل
  const rowsRaw = data.slice(20);

  // البحث عن "أولى" أو "ثانية" في الصف 21 لتحديد عمود الفترة والاسم
  let periodIdx = -1;
  let nameIdx = -1;

  for (let i = 0; i < firstDataRow.length; i++) {
    const val = normalizeString(firstDataRow[i]);
    if (val === "أولى" || val === "ثانية") {
      periodIdx = i;
      nameIdx = i + 1; // الاسم في الخلية التالية كما ذكر المستخدم
      break;
    }
  }

  // محاولة بديلة إذا لم يتم العثور بالطريقة السابقة
  if (periodIdx === -1) {
    periodIdx = headersRaw.findIndex((h: any) => normalizeString(h).includes("فترة"));
  }
  if (nameIdx === -1 || nameIdx >= headersRaw.length) {
    nameIdx = headersRaw.findIndex((h: any) => normalizeString(h).includes("اسم") || normalizeString(h).includes("الطالب"));
  }

  // إذا لم يتم العثور على الأعمدة، نتوقف لتجنب الأخطاء
  if (periodIdx === -1 || nameIdx === -1) return currentSummary;

  const saf = normalizeString(data[2]?.[1]);
  const fasel = normalizeString(data[8]?.[1]);

  if (!currentSummary[saf]) currentSummary[saf] = {};
  if (!currentSummary[saf][fasel]) currentSummary[saf][fasel] = {};

  // المواد تقع عادة قبل أعمدة الفترة والاسم
  const subjectsRangeLimit = Math.min(nameIdx, periodIdx);
  const subjectsRange = headersRaw.slice(0, subjectsRangeLimit);
  
  let currentStudentName = "";

  rowsRaw.forEach(row => {
    const nameVal = normalizeString(row[nameIdx]);
    if (nameVal) {
        currentStudentName = nameVal;
    }
    
    const periodVal = normalizeString(row[periodIdx]);
    // التحقق من صحة الفترة واسم الطالب الحالي
    if (!periodVal || (periodVal !== "أولى" && periodVal !== "ثانية") || !currentStudentName) return;

    if (!currentSummary[saf][fasel][periodVal]) {
      currentSummary[saf][fasel][periodVal] = {};
    }

    subjectsRange.forEach((subj: any, sIdx: number) => {
      const subjectName = normalizeString(subj);
      // استثناء الأعمدة غير الدراسية
      if (!subjectName || ["م", "السلوك", "المواظبة", "الاسم", "الفترة"].includes(subjectName)) return;

      if (!currentSummary[saf][fasel][periodVal][subjectName]) {
        currentSummary[saf][fasel][periodVal][subjectName] = {
          rasidCount: 0,
          lamRasidCount: 0,
          percentage: 0,
          studentRasidStatus: {},
          studentsList: []
        };
      }

      const val = row[sIdx];
      // 1 أو أي رقم أكبر من 0 يعني تم الرصد، 0 يعني لم يتم الرصد
      const isRasid = (typeof val === 'number' && val > 0);
      const isLamRasid = (val === 0 || val === "0");

      if (isRasid || isLamRasid) {
        const subData = currentSummary[saf][fasel][periodVal][subjectName];
        if (!subData.studentsList.includes(currentStudentName)) {
          subData.studentsList.push(currentStudentName);
        }
        subData.studentRasidStatus[currentStudentName] = isRasid;
        if (isRasid) subData.rasidCount++;
        else subData.lamRasidCount++;
      }
    });
  });

  // إعادة حساب النسب المئوية
  for (const p in currentSummary[saf][fasel]) {
    for (const s in currentSummary[saf][fasel][p]) {
      const d = currentSummary[saf][fasel][p][s];
      const total = d.rasidCount + d.lamRasidCount;
      d.percentage = total > 0 ? Number(((d.rasidCount / total) * 100).toFixed(2)) : 0;
    }
  }

  return currentSummary;
};
