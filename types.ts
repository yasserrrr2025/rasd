
export type Period = 'أولى' | 'ثانية' | 'نهاية فصل' | 'both';

export interface StudentStatus {
  [studentName: string]: boolean;
}

export interface SubjectData {
  rasidCount: number;
  lamRasidCount: number;
  percentage: number;
  studentRasidStatus: StudentStatus;
  studentsList: string[];
}

export interface PeriodData {
  [subjectName: string]: SubjectData;
}

export interface ClassData {
  [period: string]: PeriodData;
}

export interface RasedSummary {
  [saf: string]: {
    [fasel: string]: ClassData;
  };
}

export interface TeacherMapping {
  [saf: string]: {
    [fasel: string]: {
      [subject: string]: string[];
    };
  };
}

export interface TeacherStat {
  teacher: string;
  lamRasidCount: number;
  rasidCount: number;
  percentage: number;
}

export interface StudentGuidanceInfo {
  id: string;
  cleanId: string;
  name: string;
  saf: string;
  safCode: string;
  fasel: string;
  phone?: string;
}

export interface StudentGuidanceMap {
  byId: { [id: string]: StudentGuidanceInfo };
  byName: { [normalizedName: string]: StudentGuidanceInfo };
  totalStudents: number;
}
