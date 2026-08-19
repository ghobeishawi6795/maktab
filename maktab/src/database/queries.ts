import { Env } from '../types';
import { getDB } from './client';

/** بررسی می‌کند کلاس داده‌شده متعلق به همان معلم و مدرسه است یا نه */
export const classBelongsToTeacher = async (
  env: Env,
  classId: string,
  teacherId: string,
  schoolId: string
): Promise<boolean> => {
  const db = getDB(env);
  const row = await db
    .prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND school_id = ?')
    .bind(classId, teacherId, schoolId)
    .first();
  return !!row;
};

/** بررسی می‌کند تکلیف داده‌شده متعلق به همان معلم و مدرسه است یا نه */
export const assignmentBelongsToTeacher = async (
  env: Env,
  assignmentId: string,
  teacherId: string,
  schoolId: string
): Promise<boolean> => {
  const db = getDB(env);
  const row = await db
    .prepare('SELECT id FROM assignments WHERE id = ? AND teacher_id = ? AND school_id = ?')
    .bind(assignmentId, teacherId, schoolId)
    .first();
  return !!row;
};

/** بررسی می‌کند دانش‌آموز متعلق به همان مدرسه است یا نه */
export const studentBelongsToSchool = async (
  env: Env,
  studentId: string,
  schoolId: string
): Promise<boolean> => {
  const db = getDB(env);
  const row = await db
    .prepare('SELECT id FROM students WHERE id = ? AND school_id = ?')
    .bind(studentId, schoolId)
    .first();
  return !!row;
};
