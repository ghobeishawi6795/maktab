import { AppRequest, Env } from '../../types';
import { SchoolService } from '../../services/schoolService';
import { jsonResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new SchoolService(env);
  const schoolId = req.query?.school_id;
  const teachers = await service.listTeachers(schoolId);
  return jsonResponse({ success: true, data: teachers });
};

export const listTeachers = withAuth(withRole(['admin'])(listHandler));
