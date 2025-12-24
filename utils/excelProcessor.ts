
import * as XLSX from 'xlsx';
import { RasedSummary, SubjectData } from '../types';

export const normalizeString = (str: any): string => {
  if (!str) return "";
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
  if (data.length < 20) return currentSummary;

  const headersRaw = data[19];
  const rowsRaw = data.slice(20);

  // Identify name column (usually last) and period column
  // Based on images, Col U (index 20) is Period, Col V (index 21) is Name
  // We'll find them dynamically by searching common headers
  const nameIdx = headersRaw.findIndex((h: any) => normalizeString(h) === "الاسم");
  const periodIdx = headersRaw.findIndex((h: any) => normalizeString(h) === "الفترة" || ["أولى", "ثانية"].includes(normalizeString(data[20]?.[headersRaw.indexOf(h)])));

  const saf = normalizeString(data[2]?.[1]);
  const fasel = normalizeString(data[8]?.[1]);

  if (!currentSummary[saf]) currentSummary[saf] = {};
  if (!currentSummary[saf][fasel]) currentSummary[saf][fasel] = {};

  const subjectsRange = headersRaw.slice(0, Math.min(nameIdx, periodIdx !== -1 ? periodIdx : nameIdx));
  
  let currentStudentName = "";

  rowsRaw.forEach(row => {
    const nameVal = normalizeString(row[nameIdx]);
    if (nameVal) currentStudentName = nameVal;
    
    const periodVal = normalizeString(row[periodIdx]);
    if (!periodVal || !currentStudentName) return;
    if (periodVal !== "أولى" && periodVal !== "ثانية") return;

    if (!currentSummary[saf][fasel][periodVal]) {
      currentSummary[saf][fasel][periodVal] = {};
    }

    subjectsRange.forEach((subj: any, sIdx: number) => {
      const subjectName = normalizeString(subj);
      if (!subjectName || ["م", "السلوك", "المواظبة"].includes(subjectName)) return;

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
      const isRasid = val === 1 || (typeof val === 'number' && val > 0);
      const isLamRasid = val === 0;

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

  // Calculate percentages
  for (const p in currentSummary[saf][fasel]) {
    for (const s in currentSummary[saf][fasel][p]) {
      const d = currentSummary[saf][fasel][p][s];
      const total = d.rasidCount + d.lamRasidCount;
      d.percentage = total > 0 ? Number(((d.rasidCount / total) * 100).toFixed(2)) : 0;
    }
  }

  return currentSummary;
};
