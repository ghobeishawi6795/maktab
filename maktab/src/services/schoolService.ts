import { Env, School } from '../types';
import { getDB } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

export class SchoolService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async create(data: { name: string; domain?: string; plan?: string }) {
    const db = getDB(this.env);
    const id = uuidv4();

    await db
      .prepare('INSERT INTO schools (id, name, domain, plan) VALUES (?, ?, ?, ?)')
      .bind(id, data.name, data.domain || null, data.plan || 'trial')
      .run();

    return this.getById(id);
  }

  async getById(id: string) {
    const db = getDB(this.env);
    return await db.prepare('SELECT * FROM schools WHERE id = ?').bind(id).first<School>();
  }

  async listAll() {
    const db = getDB(this.env);
    const results = await db
      .prepare(
        `SELECT s.*,
          (SELECT COUNT(*) FROM teachers WHERE school_id = s.id) as teacher_count,
          (SELECT COUNT(*) FROM students WHERE school_id = s.id) as student_count
        FROM schools s ORDER BY s.created_at DESC`
      )
      .all();
    return results.results || [];
  }

  async listTeachers(schoolId?: string) {
    const db = getDB(this.env);
    const query = schoolId
      ? db.prepare('SELECT id, school_id, name, email, created_at FROM teachers WHERE school_id = ? ORDER BY created_at DESC').bind(schoolId)
      : db.prepare('SELECT id, school_id, name, email, created_at FROM teachers ORDER BY created_at DESC');
    const results = await query.all();
    return results.results || [];
  }

  async listStudents(schoolId?: string) {
    const db = getDB(this.env);
    const query = schoolId
      ? db.prepare('SELECT id, school_id, class_id, name, parent_phone, created_at FROM students WHERE school_id = ? ORDER BY created_at DESC').bind(schoolId)
      : db.prepare('SELECT id, school_id, class_id, name, parent_phone, created_at FROM students ORDER BY created_at DESC');
    const results = await query.all();
    return results.results || [];
  }

  async updatePlan(schoolId: string, plan: string) {
    const db = getDB(this.env);
    await db.prepare('UPDATE schools SET plan = ? WHERE id = ?').bind(plan, schoolId).run();
    return this.getById(schoolId);
  }
}
