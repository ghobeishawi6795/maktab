import { AppRequest, Env } from '../../types';
import { SchoolService } from '../../services/schoolService';
import { jsonResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new SchoolService(env);
  const schoolId = req.query?.school_id;
  const students = await service.listStudents(schoolId);
  return jsonResponse({ success: true, data: students });
};

export const listStudents = withAuth(withRole(['admin'])(listHandler));
