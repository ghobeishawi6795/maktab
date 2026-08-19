import { AppRequest, Env } from '../../types';
import { AssignmentService } from '../../services/assignmentService';
import { jsonResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const handler = async (req: AppRequest, env: Env) => {
  const service = new AssignmentService(env);
  const studentId = req.user!.id;
  const schoolId = req.user!.school_id!;

  const assignments = (await service.getStudentAssignments(studentId, schoolId)) as any[];

  const doneCount = assignments.filter((a) => a.submission_status === 'reviewed').length;
  const pendingReviewCount = assignments.filter((a) => a.submission_status === 'pending').length;
  const notSubmittedCount = assignments.filter((a) => !a.submission_status).length;

  return jsonResponse({
    success: true,
    data: {
      today_assignments: assignments.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        status: a.submission_status || 'not_submitted',
      })),
      stats: {
        done: doneCount,
        pending_review: pendingReviewCount,
        not_submitted: notSubmittedCount,
        total: assignments.length,
      },
    },
  });
};

export const dashboard = withAuth(withRole(['student'])(withTenant(handler)));
