import { AppRequest, Env } from '../../types';
import { AssignmentService } from '../../services/assignmentService';
import { jsonResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';
import { classBelongsToTeacher, assignmentBelongsToTeacher } from '../../database/queries';
import { requireFields, isValidAssignmentType, isValidISODate } from '../../utils/validators';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new AssignmentService(env);
  const assignments = await service.listByTeacher(req.user!.id, req.user!.school_id!);
  return jsonResponse({ success: true, data: assignments });
};

const createHandler = async (req: AppRequest, env: Env) => {
  try {
    const body = (await req.json()) as any;
    const { valid, missing } = requireFields(body, ['class_id', 'title', 'description', 'type', 'due_date']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);
    if (!isValidAssignmentType(body.type)) return errorResponse('نوع تکلیف نامعتبر است', 400);
    if (!isValidISODate(body.due_date)) return errorResponse('مهلت تحویل نامعتبر است', 400);

    const teacherId = req.user!.id;
    const schoolId = req.user!.school_id!;

    const ownsClass = await classBelongsToTeacher(env, body.class_id, teacherId, schoolId);
    if (!ownsClass) return errorResponse('این کلاس متعلق به شما نیست', 403);

    const service = new AssignmentService(env);
    const assignment = await service.create({
      school_id: schoolId,
      class_id: body.class_id,
      teacher_id: teacherId,
      title: body.title,
      description: body.description,
      type: body.type,
      question_data: body.question_data || null,
      due_date: body.due_date,
    });

    return jsonResponse({ success: true, data: assignment }, 201);
  } catch (error) {
    return errorResponse('خطا در ایجاد تکلیف', 500);
  }
};

const getHandler = async (req: AppRequest, env: Env) => {
  const id = req.params.id;
  const service = new AssignmentService(env);
  const assignment = await service.getById(id);

  if (!assignment || assignment.teacher_id !== req.user!.id || assignment.school_id !== req.user!.school_id) {
    return notFoundResponse('تکلیف یافت نشد');
  }

  return jsonResponse({ success: true, data: assignment });
};

const getSubmissionsHandler = async (req: AppRequest, env: Env) => {
  const id = req.params.id;
  const teacherId = req.user!.id;
  const schoolId = req.user!.school_id!;

  const owns = await assignmentBelongsToTeacher(env, id, teacherId, schoolId);
  if (!owns) return notFoundResponse('تکلیف یافت نشد');

  const service = new AssignmentService(env);
  const submissions = await service.getSubmissions(id, schoolId);
  return jsonResponse({ success: true, data: submissions });
};

const reviewSubmissionHandler = async (req: AppRequest, env: Env) => {
  try {
    const submissionId = req.params.id;
    const body = (await req.json()) as any;
    const { grade, feedback } = body;

    const { valid, missing } = requireFields(body, ['grade']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);
    if (typeof grade !== 'number' || grade < 0 || grade > 20) {
      return errorResponse('نمره باید عددی بین ۰ تا ۲۰ باشد', 400);
    }

    const service = new AssignmentService(env);
    const submission = await service.getSubmission(submissionId);
    if (!submission) return notFoundResponse('پاسخ یافت نشد');

    const owns = await assignmentBelongsToTeacher(env, submission.assignment_id, req.user!.id, req.user!.school_id!);
    if (!owns) return notFoundResponse('پاسخ یافت نشد');

    const updated = await service.reviewSubmission(submissionId, grade, feedback || '');
    return jsonResponse({ success: true, data: updated });
  } catch (error) {
    return errorResponse('خطا در بررسی پاسخ', 500);
  }
};

export const listAssignments = withAuth(withRole(['teacher'])(withTenant(listHandler)));
export const createAssignment = withAuth(withRole(['teacher'])(withTenant(createHandler)));
export const getAssignment = withAuth(withRole(['teacher'])(withTenant(getHandler)));
export const getSubmissions = withAuth(withRole(['teacher'])(withTenant(getSubmissionsHandler)));
export const reviewSubmission = withAuth(withRole(['teacher'])(withTenant(reviewSubmissionHandler)));
