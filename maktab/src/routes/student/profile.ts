import { AppRequest, Env } from '../../types';
import { StudentService } from '../../services/studentService';
import { jsonResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const handler = async (req: AppRequest, env: Env) => {
  const service = new StudentService(env);
  const student = await service.getById(req.user!.id, req.user!.school_id!);
  if (!student) return notFoundResponse('دانش‌آموز یافت نشد');

  const performance = await service.getPerformance(req.user!.id, req.user!.school_id!);

  return jsonResponse({
    success: true,
    data: {
      id: student.id,
      name: student.name,
      class_id: student.class_id,
      performance,
    },
  });
};

export const profile = withAuth(withRole(['student'])(withTenant(handler)));
