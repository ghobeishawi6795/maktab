import { AppRequest, Env } from '../../types';
import { AssignmentService } from '../../services/assignmentService';
import { jsonResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new AssignmentService(env);
  const assignments = await service.getStudentAssignments(req.user!.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: assignments });
};

const getHandler = async (req: AppRequest, env: Env) => {
  const service = new AssignmentService(env);
  const assignment = await service.getById(req.params.id);

  if (!assignment || assignment.school_id !== req.user!.school_id || assignment.class_id !== req.user!.class_id) {
    return notFoundResponse('تکلیف یافت نشد');
  }

  return jsonResponse({ success: true, data: assignment });
};

export const listAssignments = withAuth(withRole(['student'])(withTenant(listHandler)));
export const getAssignment = withAuth(withRole(['student'])(withTenant(getHandler)));
