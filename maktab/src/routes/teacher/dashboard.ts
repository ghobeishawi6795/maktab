import { AppRequest, Env } from '../../types';
import { AssignmentService } from '../../services/assignmentService';
import { TeacherService } from '../../services/teacherService';
import { jsonResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const handler = async (req: AppRequest, env: Env) => {
  const assignmentService = new AssignmentService(env);
  const teacherService = new TeacherService(env);
  const teacherId = req.user!.id;
  const schoolId = req.user!.school_id!;

  const [stats, assignments, classes, teacher] = await Promise.all([
    assignmentService.getStats(teacherId, schoolId),
    assignmentService.listByTeacher(teacherId, schoolId),
    teacherService.listClasses(teacherId, schoolId),
    teacherService.getById(teacherId),
  ]);

  const totalStudents = (classes as any[]).reduce((sum, c) => sum + (c.student_count || 0), 0);

  return jsonResponse({
    success: true,
    data: {
      stats: {
        active: stats.activeAssignments,
        pending: stats.pendingReviews,
        reviewed: stats.reviewedSubmissions,
        total_students: totalStudents,
      },
      recent_assignments: (assignments as any[]).slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        due_date: a.due_date,
        class_name: a.class_name,
        submissions_count: a.submissions_count || 0,
      })),
      teacher: {
        name: teacher?.name || '',
        class_count: classes.length,
      },
    },
  });
};

export const dashboard = withAuth(withRole(['teacher'])(withTenant(handler)));
