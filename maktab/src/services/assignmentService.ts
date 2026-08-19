import { Env, Assignment, Submission } from '../types';
import { getDB } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

export class AssignmentService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async create(data: Omit<Assignment, 'id' | 'created_at' | 'status'>) {
    const db = getDB(this.env);
    const id = uuidv4();

    await db
      .prepare(
        `INSERT INTO assignments
        (id, school_id, class_id, teacher_id, title, description, type, question_data, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.school_id,
        data.class_id,
        data.teacher_id,
        data.title,
        data.description,
        data.type,
        data.question_data || null,
        data.due_date
      )
      .run();

    return this.getById(id);
  }

  async getById(id: string) {
    const db = getDB(this.env);
    return await db.prepare('SELECT * FROM assignments WHERE id = ?').bind(id).first<Assignment>();
  }

  async listByTeacher(teacherId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT a.*, c.name as class_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submissions_count
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.teacher_id = ? AND a.school_id = ?
        ORDER BY a.created_at DESC`
      )
      .bind(teacherId, schoolId)
      .all();

    return results.results || [];
  }

  async listByClass(classId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT * FROM assignments
        WHERE class_id = ? AND school_id = ? AND status = 'active'
        ORDER BY due_date ASC`
      )
      .bind(classId, schoolId)
      .all();

    return results.results || [];
  }

  async getSubmissions(assignmentId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT s.*, st.name as student_name
        FROM submissions s
        JOIN students st ON s.student_id = st.id
        WHERE s.assignment_id = ? AND st.school_id = ?
        ORDER BY s.submitted_at DESC`
      )
      .bind(assignmentId, schoolId)
      .all();

    return results.results || [];
  }

  async getStats(teacherId: string, schoolId: string) {
    const db = getDB(this.env);

    const active = await db
      .prepare(
        `SELECT COUNT(*) as count FROM assignments WHERE teacher_id = ? AND school_id = ? AND status = 'active'`
      )
      .bind(teacherId, schoolId)
      .first<{ count: number }>();

    const pending = await db
      .prepare(
        `SELECT COUNT(*) as count FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE a.teacher_id = ? AND a.school_id = ? AND s.status = 'pending'`
      )
      .bind(teacherId, schoolId)
      .first<{ count: number }>();

    const reviewed = await db
      .prepare(
        `SELECT COUNT(*) as count FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE a.teacher_id = ? AND a.school_id = ? AND s.status = 'reviewed'`
      )
      .bind(teacherId, schoolId)
      .first<{ count: number }>();

    return {
      activeAssignments: active?.count || 0,
      pendingReviews: pending?.count || 0,
      reviewedSubmissions: reviewed?.count || 0,
    };
  }

  /** بررسی می‌کند شاگرد قبلاً برای این تکلیف پاسخ فرستاده یا نه، و مالکیت تکلیف را چک می‌کند */
  async submitAnswer(assignmentId: string, studentId: string, content: string, fileKey?: string) {
    const db = getDB(this.env);

    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('تکلیف یافت نشد');
    }

    const student = await db
      .prepare('SELECT class_id FROM students WHERE id = ?')
      .bind(studentId)
      .first<{ class_id: string }>();
    if (!student || student.class_id !== assignment.class_id) {
      throw new Error('این تکلیف برای کلاس شما نیست');
    }

    const id = uuidv4();

    const existing = await db
      .prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?')
      .bind(assignmentId, studentId)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE submissions SET content = ?, file_key = ?, submitted_at = CURRENT_TIMESTAMP,
           status = 'pending', grade = NULL, feedback = NULL, reviewed_at = NULL WHERE id = ?`
        )
        .bind(content, fileKey || null, existing.id)
        .run();
      return this.getSubmission(existing.id);
    }

    await db
      .prepare(
        `INSERT INTO submissions (id, assignment_id, student_id, content, file_key)
        VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, assignmentId, studentId, content, fileKey || null)
      .run();

    return this.getSubmission(id);
  }

  async getSubmission(id: string) {
    const db = getDB(this.env);
    return await db
      .prepare(
        `SELECT s.*, st.name as student_name, a.title as assignment_title
        FROM submissions s
        JOIN students st ON s.student_id = st.id
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.id = ?`
      )
      .bind(id)
      .first<Submission & { student_name: string; assignment_title: string }>();
  }

  async reviewSubmission(id: string, grade: number, feedback: string) {
    const db = getDB(this.env);
    await db
      .prepare(
        `UPDATE submissions SET grade = ?, feedback = ?, status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      )
      .bind(grade, feedback, id)
      .run();

    return this.getSubmission(id);
  }

  async getStudentAssignments(studentId: string, schoolId: string) {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT a.*,
        (SELECT status FROM submissions WHERE assignment_id = a.id AND student_id = ?) as submission_status,
        (SELECT content FROM submissions WHERE assignment_id = a.id AND student_id = ?) as submission_content,
        (SELECT grade FROM submissions WHERE assignment_id = a.id AND student_id = ?) as submission_grade,
        (SELECT feedback FROM submissions WHERE assignment_id = a.id AND student_id = ?) as submission_feedback
        FROM assignments a
        JOIN students st ON a.class_id = st.class_id
        WHERE st.id = ? AND a.school_id = ? AND a.status = 'active'
        ORDER BY a.due_date ASC`
      )
      .bind(studentId, studentId, studentId, studentId, studentId, schoolId)
      .all();

    return results.results || [];
  }
}
