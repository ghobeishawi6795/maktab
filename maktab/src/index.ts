import { Router } from 'itty-router';
import { Env } from './types';
import { errorResponse } from './utils/response';
import { FileService } from './services/fileService';

// مسیرهای عمومی
import { login, register } from './routes/public/auth';
import { landing, pricing } from './routes/public/landing';

// مسیرهای معلم
import { dashboard as teacherDashboard } from './routes/teacher/dashboard';
import {
  listAssignments,
  createAssignment,
  getAssignment,
  getSubmissions,
  reviewSubmission,
} from './routes/teacher/assignments';
import { listClasses, createClass, getClass } from './routes/teacher/classes';
import { listStudents, createStudent, getStudent, resetStudentLoginCode } from './routes/teacher/students';
import { classReport } from './routes/teacher/reports';

// مسیرهای دانش‌آموز
import { dashboard as studentDashboard } from './routes/student/dashboard';
import {
  listAssignments as studentListAssignments,
  getAssignment as studentGetAssignment,
} from './routes/student/assignments';
import { submitAnswer, getSubmissions as studentSubmissions } from './routes/student/submission';
import { profile as studentProfile } from './routes/student/profile';

// مسیرهای ادمین
import { listSchools, createSchool, getSchool, updateSchoolPlan } from './routes/admin/schools';
import { listTeachers as adminListTeachers } from './routes/admin/teachers';
import { listStudents as adminListStudents } from './routes/admin/students';
import { getSettings } from './routes/admin/settings';

const router = Router();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // برای پروداکشن این را به دامنه فرانت‌اند محدود کن
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

router.options('*', () => new Response(null, { status: 204, headers: CORS_HEADERS }));

// =================== مسیرهای عمومی ===================
router.get('/', landing);
router.get('/pricing', pricing);
router.post('/api/auth/login', login);
router.post('/api/auth/register', register);

router.get('/api/files/*', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const key = url.pathname.replace('/api/files/', '');
  const fileService = new FileService(env);
  const file = await fileService.getFile(key);
  if (!file) return errorResponse('فایل یافت نشد', 404);
  return new Response(file.body as any, { headers: file.headers });
});

// =================== مسیرهای معلم ===================
router.get('/api/teacher/dashboard', teacherDashboard);

router.get('/api/teacher/classes', listClasses);
router.post('/api/teacher/classes', createClass);
router.get('/api/teacher/classes/:id', getClass);
router.get('/api/teacher/classes/:classId/report', classReport);

router.get('/api/teacher/assignments', listAssignments);
router.post('/api/teacher/assignments', createAssignment);
router.get('/api/teacher/assignments/:id', getAssignment);
router.get('/api/teacher/assignments/:id/submissions', getSubmissions);
router.put('/api/teacher/submissions/:id/review', reviewSubmission);

router.get('/api/teacher/students', listStudents);
router.post('/api/teacher/students', createStudent);
router.get('/api/teacher/students/:id', getStudent);
router.post('/api/teacher/students/:id/reset-code', resetStudentLoginCode);

// =================== مسیرهای دانش‌آموز ===================
router.get('/api/student/dashboard', studentDashboard);
router.get('/api/student/profile', studentProfile);
router.get('/api/student/assignments', studentListAssignments);
router.get('/api/student/assignments/:id', studentGetAssignment);
router.get('/api/student/submissions', studentSubmissions);
router.post('/api/student/submissions', submitAnswer);

// =================== مسیرهای ادمین ===================
router.get('/api/admin/settings', getSettings);
router.get('/api/admin/schools', listSchools);
router.post('/api/admin/schools', createSchool);
router.get('/api/admin/schools/:id', getSchool);
router.put('/api/admin/schools/:id/plan', updateSchoolPlan);
router.get('/api/admin/teachers', adminListTeachers);
router.get('/api/admin/students', adminListStudents);

// =================== 404 ===================
router.all('*', () => errorResponse('یافت نشد', 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    let response: Response;
    try {
      response = await router.handle(request, env, ctx);
    } catch (error) {
      console.error(error);
      response = errorResponse('خطای داخلی سرور', 500);
    }

    const headers = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;
