import { AppRequest, Env } from '../../types';
import { TeacherService } from '../../services/teacherService';
import { jsonResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';
import { requireFields } from '../../utils/validators';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new TeacherService(env);
  const classes = await service.listClasses(req.user!.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: classes });
};

const createHandler = async (req: AppRequest, env: Env) => {
  try {
    const body = (await req.json()) as any;
    const { valid, missing } = requireFields(body, ['name', 'grade']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

    const service = new TeacherService(env);
    const cls = await service.createClass({
      school_id: req.user!.school_id!,
      teacher_id: req.user!.id,
      name: body.name,
      grade: Number(body.grade),
    });

    return jsonResponse({ success: true, data: cls }, 201);
  } catch (error) {
    return errorResponse('خطا در ایجاد کلاس', 500);
  }
};

const getHandler = async (req: AppRequest, env: Env) => {
  const service = new TeacherService(env);
  const cls = await service.getClassById(req.params.id, req.user!.school_id!);

  if (!cls || cls.teacher_id !== req.user!.id) {
    return notFoundResponse('کلاس یافت نشد');
  }

  return jsonResponse({ success: true, data: cls });
};

export const listClasses = withAuth(withRole(['teacher'])(withTenant(listHandler)));
export const createClass = withAuth(withRole(['teacher'])(withTenant(createHandler)));
export const getClass = withAuth(withRole(['teacher'])(withTenant(getHandler)));
