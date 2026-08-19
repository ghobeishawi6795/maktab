import { Env, Student } from '../types';
import { getDB } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

const generateLoginCode = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000)); // کد ۴ رقمی
};

export class StudentService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async create(data: { school_id: string; class_id: string; name: string; parent_phone?: string }) {
    const db = getDB(this.env);
    const id = uuidv4();
    const loginCode = generateLoginCode();

    await db
      .prepare(
        'INSERT INTO students (id, school_id, class_id, name, parent_phone, login_code) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, data.school_id, data.class_id, data.name, data.parent_phone || null, loginCode)
      .run();

    return this.getById(id, data.school_id);
  }

  async getById(id: string, schoolId: string) {
    const db = getDB(this.env);
    return await db
      .prepare('SELECT * FROM students WHERE id = ? AND school_id = ?')
      .bind(id, schoolId)
      .first<Student>();
  }

  async listByClass(classId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare('SELECT * FROM students WHERE class_id = ? AND school_id = ? ORDER BY name ASC')
      .bind(classId, schoolId)
      .all();
    return results.results || [];
  }

  async listByTeacher(teacherId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT st.*, c.name as class_name FROM students st
        JOIN classes c ON st.class_id = c.id
        WHERE c.teacher_id = ? AND st.school_id = ?
        ORDER BY c.name, st.name ASC`
      )
      .bind(teacherId, schoolId)
      .all();
    return results.results || [];
  }

  /** عملکرد یک دانش‌آموز: تعداد تکالیف، انجام‌شده، میانگین نمره */
  async getPerformance(studentId: string, schoolId: string) {
    const db = getDB(this.env);

    const stats = await db
      .prepare(
        `SELECT
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT s.id) as total_submissions,
          AVG(s.grade) as average_grade
        FROM students st
        JOIN assignments a ON a.class_id = st.class_id AND a.school_id = st.school_id
        LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = st.id
        WHERE st.id = ? AND st.school_id = ?`
      )
      .bind(studentId, schoolId)
      .first<{ total_assignments: number; total_submissions: number; average_grade: number | null }>();

    return {
      totalAssignments: stats?.total_assignments || 0,
      totalSubmissions: stats?.total_submissions || 0,
      averageGrade: stats?.average_grade ? Math.round(stats.average_grade * 10) / 10 : null,
    };
  }

  async resetLoginCode(studentId: string, schoolId: string) {
    const db = getDB(this.env);
    const newCode = generateLoginCode();
    await db
      .prepare('UPDATE students SET login_code = ? WHERE id = ? AND school_id = ?')
      .bind(newCode, studentId, schoolId)
      .run();
    return newCode;
  }
}
