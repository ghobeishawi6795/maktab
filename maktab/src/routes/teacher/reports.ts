import { AppRequest, Env } from '../../types';
import { TeacherService } from '../../services/teacherService';
import { jsonResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const classReportHandler = async (req: AppRequest, env: Env) => {
  const service = new TeacherService(env);
  const schoolId = req.user!.school_id!;
  const classId = req.params.classId;

  const cls = await service.getClassById(classId, schoolId);
  if (!cls || cls.teacher_id !== req.user!.id) {
    return notFoundResponse('کلاس یافت نشد');
  }

  const report = await service.getClassReport(classId, schoolId);
  return jsonResponse({ success: true, data: report });
};

export const classReport = withAuth(withRole(['teacher'])(withTenant(classReportHandler)));
