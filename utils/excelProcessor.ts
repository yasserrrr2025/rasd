import * as XLSX from 'xlsx';
import { RasedSummary, StudentGuidanceMap, StudentGuidanceInfo } from '../types';

export const normalizeString = (str: any): string => {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/\u00A0/g, " ").trim();
};

export const normalizeArabic = (str: any): string => {
  if (!str) return "";
  return str
    .toString()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const SAF_CODE_MAP: { [code: string]: string } = {
  '0730': 'الأول المتوسط',
  '0830': 'الثاني المتوسط',
  '0930': 'الثالث المتوسط',
  '07': 'الأول المتوسط',
  '08': 'الثاني المتوسط',
  '09': 'الثالث المتوسط'
};

/**
 * معالجة ملف الإرشاد الطلابي (بيانات الطلاب وأرقام صفوفهم وفصولهم)
 */
export const processStudentGuidanceFile = async (file: File): Promise<StudentGuidanceMap> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const guidanceMap: StudentGuidanceMap = {
          byId: {},
          byName: {},
          totalStudents: 0
        };

        // البحث في جميع الشيتات عن الشيت المحتوي على بيانات الطلاب
        for (const sname of wb.SheetNames) {
          const sheet = wb.Sheets[sname];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!rows || rows.length === 0) continue;

          let headerRowIdx = -1;
          const colIdx = { id: -1, name: -1, saf: -1, fasel: -1, phone: -1 };

          for (let r = 0; r < Math.min(15, rows.length); r++) {
            const row = rows[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
              const val = normalizeString(row[c]);
              if (val.includes("رقم الطالب") || val.includes("رقم السجل") || val.includes("الهوية")) colIdx.id = c;
              if (val.includes("اسم الطالب") || (val.includes("الاسم") && !val.includes("المدرسة"))) colIdx.name = c;
              if (val.includes("رقم الصف") || val === "الصف") colIdx.saf = c;
              if (val.includes("الفصل") && !val.includes("الدراسي")) colIdx.fasel = c;
              if (val.includes("الجوال") || val.includes("هاتف")) colIdx.phone = c;
            }

            if (colIdx.id !== -1 || (colIdx.name !== -1 && colIdx.fasel !== -1)) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            for (let r = headerRowIdx + 1; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;

              const rawId = normalizeString(row[colIdx.id]);
              const rawName = normalizeString(row[colIdx.name]);
              if (!rawId && !rawName) continue;

              const cleanId = rawId.replace(/[^0-9]/g, "");
              const rawSaf = normalizeString(row[colIdx.saf]);
              const fasel = normalizeString(row[colIdx.fasel]);
              const phone = colIdx.phone !== -1 ? normalizeString(row[colIdx.phone]) : undefined;

              const saf = SAF_CODE_MAP[rawSaf] || rawSaf || "غير معروف";

              const info: StudentGuidanceInfo = {
                id: rawId,
                cleanId,
                name: rawName,
                saf,
                safCode: rawSaf,
                fasel,
                phone
              };

              if (rawId) guidanceMap.byId[rawId] = info;
              if (cleanId) guidanceMap.byId[cleanId] = info;
              if (rawName) guidanceMap.byName[normalizeArabic(rawName)] = info;
              guidanceMap.totalStudents++;
            }
            break; // اكتفينا بالشيت الذي وجدنا فيه بيانات الطلاب
          }
        }

        resolve(guidanceMap);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * فحص وقراءة ملف رصد درجات نور
 */
export const processRasedFile = async (file: File): Promise<{ saf: string; fasel: string; data: any[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let saf = "غير معروف";
        let fasel = "الكل";

        // البحث الديناميكي عن الصف والفصل من الترويسة
        for (let r = 0; r < Math.min(20, jsonData.length); r++) {
          const row = jsonData[r];
          if (!row) continue;
          for (let c = 0; c < row.length; c++) {
            const cellVal = normalizeString(row[c]);

            // البحث عن الصف
            if (cellVal === "الصف" || cellVal.includes("الصف:")) {
              // القيمة تكون غالباً في العمود 0 أو العمود المجاور
              const val1 = normalizeString(row[0]);
              const valNeighbor = c > 0 ? normalizeString(row[c - 1]) : "";
              saf = val1 || valNeighbor || saf;
            }

            // البحث عن الفصل (مع استثناء "الفصل الدراسي")
            if ((cellVal === "الفصل" || cellVal.includes("الفصل:")) && !cellVal.includes("الدراسي")) {
              const val1 = normalizeString(row[0]);
              const valNeighbor = c > 0 ? normalizeString(row[c - 1]) : "";
              fasel = val1 || valNeighbor || fasel;
            }
          }
        }

        // مطابقة بديلة في حال لم يتم العثور بالطريقة السابقة
        if (saf === "غير معروف") {
          saf = normalizeString(jsonData[6]?.[0] || jsonData[2]?.[1] || "غير معروف");
        }
        if (fasel === "الكل" && jsonData[13]?.[0]) {
          fasel = normalizeString(jsonData[13][0]);
        }

        resolve({ saf, fasel, data: jsonData });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * استخراج وتجميع درجات الرصد
 */
export const extractSummaryData = (
  data: any[][],
  currentSummary: RasedSummary,
  guidanceMap?: StudentGuidanceMap | null,
  fileSafFallback?: string,
  fileFaselFallback?: string
): RasedSummary => {
  if (data.length < 10) return currentSummary;

  // البحث الديناميكي عن سطر العناوين الرئيسي (يحتوي على "الفترة" أو "الطالب")
  let headerRowIdx = -1;
  let periodIdx = -1;
  let studentIdx = -1;

  for (let r = 0; r < Math.min(30, data.length); r++) {
    const row = data[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const val = normalizeString(row[c]);
      if (val.includes("فترة") || val === "الفترة") periodIdx = c;
      if (val.includes("طالب") || val.includes("الطالب") || val.includes("اسم الطالب")) studentIdx = c;
    }

    if (periodIdx !== -1 && studentIdx !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  // إذا لم نجد الترويسة بالشكل المعتاد، نحاول في السطر 19 كما في النسخ القديمة
  if (headerRowIdx === -1 && data.length >= 20) {
    headerRowIdx = 19;
    periodIdx = data[19]?.findIndex((h: any) => normalizeString(h).includes("فترة"));
    studentIdx = data[19]?.findIndex((h: any) => normalizeString(h).includes("طالب") || normalizeString(h).includes("اسم"));
  }

  if (headerRowIdx === -1 || periodIdx === -1 || studentIdx === -1) {
    return currentSummary;
  }

  const headersRaw = data[headerRowIdx];
  const rowsRaw = data.slice(headerRowIdx + 1);

  // تحديد أعمدة المواد الدراسية (كل الأعمدة ما عدا الفترة واسم الطالب والأعمدة الإدارية)
  const ignoredKeywords = ["م", "السلوك", "المواظبة", "الاسم", "الطالب", "الفترة", "الصف", "الفصل", "ملاحظات", "رقم"];
  const subjectColumns: { index: number; name: string }[] = [];

  headersRaw.forEach((h: any, idx: number) => {
    if (idx === periodIdx || idx === studentIdx) return;
    const name = normalizeString(h);
    if (!name || ignoredKeywords.includes(name)) return;
    subjectColumns.push({ index: idx, name });
  });

  // تحديد الصف والفصل الافتراضيين للملف
  let defaultSaf = fileSafFallback || "غير معروف";
  let defaultFasel = fileFaselFallback || "الكل";

  // فحص أولي للترويسة إذا لم تكن ممررة
  if (defaultSaf === "غير معروف" || defaultFasel === "الكل") {
    for (let r = 0; r < Math.min(headerRowIdx, data.length); r++) {
      const row = data[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const val = normalizeString(row[c]);
        if (val === "الصف" || val.includes("الصف:")) {
          defaultSaf = normalizeString(row[0]) || defaultSaf;
        }
        if ((val === "الفصل" || val.includes("الفصل:")) && !val.includes("الدراسي")) {
          defaultFasel = normalizeString(row[0]) || defaultFasel;
        }
      }
    }
  }

  let currentStudentId = "";
  let currentStudentName = "";

  rowsRaw.forEach((row) => {
    if (!row || row.length === 0) return;

    // استخراج بيانات الطالب
    const studentCellVal = normalizeString(row[studentIdx]);
    if (studentCellVal) {
      // قد تحتوي الخانة على سطرين: "رقم الهوية: 1157996784\nالاسم: مؤيد احمد عسيري"
      const idMatch = studentCellVal.match(/رقم الهوية:\s*([^\s\n\r]+)/) || studentCellVal.match(/\b\d{10}\b/);
      const nameMatch = studentCellVal.match(/الاسم:\s*([^\n\r]+)/);

      currentStudentId = idMatch ? idMatch[1].trim() : "";
      currentStudentName = nameMatch ? normalizeString(nameMatch[1]) : studentCellVal;
    }

    if (!currentStudentName) return;

    // تحديد الفترة: "أولى", "ثانية", "نهاية فصل"
    const rawPeriod = normalizeString(row[periodIdx]);
    if (!rawPeriod) return;

    let periodVal: 'أولى' | 'ثانية' | 'نهاية فصل' | null = null;
    if (rawPeriod.includes("اولى") || rawPeriod.includes("أولى")) {
      periodVal = 'أولى';
    } else if (rawPeriod.includes("ثانيه") || rawPeriod.includes("ثانية")) {
      periodVal = 'ثانية';
    } else if (rawPeriod.includes("نهايه") || rawPeriod.includes("نهاية") || rawPeriod.includes("فصل")) {
      periodVal = 'نهاية فصل';
    }

    if (!periodVal) return;

    // تحديد الصف والفصل الفعلي للطالب (من الإرشاد الطلابي إن وجد، أو من الملف)
    let finalSaf = defaultSaf;
    let finalFasel = defaultFasel;

    if (guidanceMap) {
      // محاولة المطابقة: بالهوية التامة، ثم بالاسم، ثم بالأرقام المجردة
      let match = guidanceMap.byId[currentStudentId] || guidanceMap.byName[normalizeArabic(currentStudentName)];

      if (!match) {
        const cleanId = currentStudentId.replace(/[^0-9]/g, "");
        if (cleanId) match = guidanceMap.byId[cleanId];
      }

      if (match) {
        if (match.fasel) finalFasel = match.fasel;
        if (match.saf && (finalSaf === "غير معروف" || finalSaf === "الكل")) {
          finalSaf = match.saf;
        }
      }
    }

    // بناء الهيكل البياني
    if (!currentSummary[finalSaf]) currentSummary[finalSaf] = {};
    if (!currentSummary[finalSaf][finalFasel]) currentSummary[finalSaf][finalFasel] = {};
    if (!currentSummary[finalSaf][finalFasel][periodVal]) {
      currentSummary[finalSaf][finalFasel][periodVal] = {};
    }

    const periodData = currentSummary[finalSaf][finalFasel][periodVal];

    // رصد كل مادة
    subjectColumns.forEach(({ index, name }) => {
      if (!periodData[name]) {
        periodData[name] = {
          rasidCount: 0,
          lamRasidCount: 0,
          percentage: 0,
          studentRasidStatus: {},
          studentsList: []
        };
      }

      const subData = periodData[name];
      if (!subData.studentsList.includes(currentStudentName)) {
        subData.studentsList.push(currentStudentName);
      }

      const cellVal = row[index];
      // 1 = تم الرصد، 0 = لم يتم الرصد
      const isRasid = cellVal === 1 || cellVal === "1" || cellVal === true || (typeof cellVal === 'number' && cellVal > 0);
      const isLamRasid = cellVal === 0 || cellVal === "0" || cellVal === false;

      if (isRasid) {
        subData.studentRasidStatus[currentStudentName] = true;
        subData.rasidCount++;
      } else if (isLamRasid) {
        subData.studentRasidStatus[currentStudentName] = false;
        subData.lamRasidCount++;
      }
    });
  });

  // إعادة حساب النسب المئوية بدقة
  for (const s in currentSummary) {
    for (const f in currentSummary[s]) {
      for (const p in currentSummary[s][f]) {
        for (const subj in currentSummary[s][f][p]) {
          const item = currentSummary[s][f][p][subj];
          const total = item.rasidCount + item.lamRasidCount;
          item.percentage = total > 0 ? Number(((item.rasidCount / total) * 100).toFixed(1)) : 0;
        }
      }
    }
  }

  return currentSummary;
};
