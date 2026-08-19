import { Env, Class, Teacher } from '../types';
import { getDB } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

export class TeacherService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getById(id: string) {
    const db = getDB(this.env);
    return await db.prepare('SELECT id, school_id, name, email, created_at FROM teachers WHERE id = ?').bind(id).first<Omit<Teacher, 'password_hash'>>();
  }

  async createClass(data: { school_id: string; teacher_id: string; name: string; grade: number }) {
    const db = getDB(this.env);
    const id = uuidv4();

    await db
      .prepare('INSERT INTO classes (id, school_id, teacher_id, name, grade) VALUES (?, ?, ?, ?, ?)')
      .bind(id, data.school_id, data.teacher_id, data.name, data.grade)
      .run();

    return this.getClassById(id, data.school_id);
  }

  async getClassById(id: string, schoolId: string) {
    const db = getDB(this.env);
    return await db
      .prepare('SELECT * FROM classes WHERE id = ? AND school_id = ?')
      .bind(id, schoolId)
      .first<Class>();
  }

  async listClasses(teacherId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
        FROM classes c WHERE c.teacher_id = ? AND c.school_id = ?
        ORDER BY c.name ASC`
      )
      .bind(teacherId, schoolId)
      .all();
    return results.results || [];
  }

  /** گزارش عملکرد کلی کلاس: میانگین نمرات، درصد تکمیل تکالیف */
  async getClassReport(classId: string, schoolId: string) {
    const db = getDB(this.env);

    const summary = await db
      .prepare(
        `SELECT
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT st.id) as total_students,
          COUNT(DISTINCT s.id) as total_submissions,
          AVG(s.grade) as average_grade
        FROM classes c
        LEFT JOIN students st ON st.class_id = c.id
        LEFT JOIN assignments a ON a.class_id = c.id
        LEFT JOIN submissions s ON s.assignment_id = a.id
        WHERE c.id = ? AND c.school_id = ?`
      )
      .bind(classId, schoolId)
      .first<{
        total_assignments: number;
        total_students: number;
        total_submissions: number;
        average_grade: number | null;
      }>();

    const overdue = await db
      .prepare(
        `SELECT a.id, a.title, a.due_date,
          (SELECT COUNT(*) FROM students WHERE class_id = ?) -
          (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as missing_count
        FROM assignments a
        WHERE a.class_id = ? AND a.school_id = ? AND a.due_date < CURRENT_TIMESTAMP AND a.status = 'active'
        ORDER BY a.due_date DESC`
      )
      .bind(classId, classId, schoolId)
      .all();

    return {
      totalAssignments: summary?.total_assignments || 0,
      totalStudents: summary?.total_students || 0,
      totalSubmissions: summary?.total_submissions || 0,
      averageGrade: summary?.average_grade ? Math.round(summary.average_grade * 10) / 10 : null,
      overdueAssignments: overdue.results || [],
    };
  }
}
