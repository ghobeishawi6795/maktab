import { AppRequest, Env } from '../../types';
import { StudentService } from '../../services/studentService';
import { jsonResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';
import { classBelongsToTeacher } from '../../database/queries';
import { requireFields } from '../../utils/validators';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new StudentService(env);
  const students = await service.listByTeacher(req.user!.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: students });
};

const createHandler = async (req: AppRequest, env: Env) => {
  try {
    const body = (await req.json()) as any;
    const { valid, missing } = requireFields(body, ['class_id', 'name']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

    const schoolId = req.user!.school_id!;
    const owns = await classBelongsToTeacher(env, body.class_id, req.user!.id, schoolId);
    if (!owns) return errorResponse('این کلاس متعلق به شما نیست', 403);

    const service = new StudentService(env);
    const student = await service.create({
      school_id: schoolId,
      class_id: body.class_id,
      name: body.name,
      parent_phone: body.parent_phone,
    });

    return jsonResponse({ success: true, data: student }, 201);
  } catch (error) {
    return errorResponse('خطا در افزودن دانش‌آموز', 500);
  }
};

const getHandler = async (req: AppRequest, env: Env) => {
  const service = new StudentService(env);
  const student = await service.getById(req.params.id, req.user!.school_id!);
  if (!student) return notFoundResponse('دانش‌آموز یافت نشد');

  const performance = await service.getPerformance(req.params.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: { ...student, performance } });
};

const resetCodeHandler = async (req: AppRequest, env: Env) => {
  const service = new StudentService(env);
  const student = await service.getById(req.params.id, req.user!.school_id!);
  if (!student) return notFoundResponse('دانش‌آموز یافت نشد');

  const newCode = await service.resetLoginCode(req.params.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: { login_code: newCode } });
};

export const listStudents = withAuth(withRole(['teacher'])(withTenant(listHandler)));
export const createStudent = withAuth(withRole(['teacher'])(withTenant(createHandler)));
export const getStudent = withAuth(withRole(['teacher'])(withTenant(getHandler)));
export const resetStudentLoginCode = withAuth(withRole(['teacher'])(withTenant(resetCodeHandler)));
