import { Env, Teacher, Student, Admin } from '../types';
import { getDB } from '../database/client';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, verifyToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async registerTeacher(data: { name: string; email: string; password: string; school_id: string }) {
    const db = getDB(this.env);

    const existing = await db
      .prepare('SELECT id FROM teachers WHERE email = ?')
      .bind(data.email)
      .first();
    if (existing) {
      throw new Error('این ایمیل قبلاً ثبت شده است');
    }

    const school = await db.prepare('SELECT id FROM schools WHERE id = ?').bind(data.school_id).first();
    if (!school) {
      throw new Error('مدرسه یافت نشد');
    }

    const id = uuidv4();
    const hashedPassword = await hashPassword(data.password);

    await db
      .prepare('INSERT INTO teachers (id, school_id, name, email, password_hash) VALUES (?, ?, ?, ?, ?)')
      .bind(id, data.school_id, data.name, data.email, hashedPassword)
      .run();

    return { id, name: data.name, email: data.email, role: 'teacher' as const };
  }

  async loginTeacher(email: string, password: string) {
    const db = getDB(this.env);
    const result = await db.prepare('SELECT * FROM teachers WHERE email = ?').bind(email).first<Teacher>();

    if (!result) return null;

    const isValid = await comparePassword(password, result.password_hash);
    if (!isValid) return null;

    const token = await signToken(
      { id: result.id, role: 'teacher', school_id: result.school_id },
      this.env.JWT_SECRET
    );

    return {
      token,
      user: { id: result.id, name: result.name, email: result.email, role: 'teacher' as const },
    };
  }

  /**
   * ورود دانش‌آموز با شناسه + کد ورود کوتاه (login_code).
   * فقط شناسه کافی نیست — چون شناسه‌ها معمولاً حدس‌زدنی یا قابل مشاهده هستند.
   */
  async loginStudent(studentId: string, loginCode: string) {
    const db = getDB(this.env);
    const result = await db.prepare('SELECT * FROM students WHERE id = ?').bind(studentId).first<Student>();

    if (!result) return null;
    if (result.login_code !== loginCode) return null;

    const token = await signToken(
      { id: result.id, role: 'student', school_id: result.school_id, class_id: result.class_id },
      this.env.JWT_SECRET
    );

    return {
      token,
      user: { id: result.id, name: result.name, role: 'student' as const },
    };
  }

  async loginAdmin(email: string, password: string) {
    const db = getDB(this.env);
    const result = await db.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first<Admin>();

    if (!result) return null;

    const isValid = await comparePassword(password, result.password_hash);
    if (!isValid) return null;

    const token = await signToken({ id: result.id, role: 'admin' }, this.env.JWT_SECRET);

    return {
      token,
      user: { id: result.id, name: result.name, email: result.email, role: 'admin' as const },
    };
  }

  async verifyToken(token: string) {
    return await verifyToken(token, this.env.JWT_SECRET);
  }
}
