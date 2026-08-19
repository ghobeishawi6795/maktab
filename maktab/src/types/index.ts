export interface School {
  id: string;
  name: string;
  domain?: string;
  plan?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  parent_phone?: string;
  login_code: string;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  grade: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  school_id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  type: 'text' | 'quiz' | 'audio' | 'image' | 'pdf' | 'interactive';
  question_data?: string | null;
  due_date: string;
  created_at: string;
  status: 'active' | 'expired' | 'archived';
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  file_key?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'pending' | 'reviewed';
  reviewed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: 'teacher' | 'student';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export type UserRole = 'teacher' | 'student' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
  school_id?: string;
  class_id?: string;
}

// itty-router injects `params` on the request at match time.
export interface AppRequest extends Request {
  user?: AuthUser;
  params: Record<string, string>;
  query?: Record<string, string>;
}

export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  JWT_SECRET: string;
}
