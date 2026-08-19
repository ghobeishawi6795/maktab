import { AppRequest, Env } from '../../types';
import { AssignmentService } from '../../services/assignmentService';
import { FileService } from '../../services/fileService';
import { jsonResponse, errorResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { withTenant } from '../../middleware/tenant';

const submitHandler = async (req: AppRequest, env: Env) => {
  try {
    const formData = await req.formData();
    const assignmentId = formData.get('assignmentId') as string;
    const content = (formData.get('content') as string) || '';
    const file = formData.get('file') as File | null;

    if (!assignmentId) return errorResponse('شناسه تکلیف الزامی است', 400);
    if (!content && !file) return errorResponse('پاسخ یا فایل ارسال کن', 400);

    let fileKey: string | undefined;
    if (file) {
      const fileService = new FileService(env);
      const uploadResult = await fileService.uploadFile(file, 'submissions');
      fileKey = uploadResult.key;
    }

    const service = new AssignmentService(env);
    const submission = await service.submitAnswer(assignmentId, req.user!.id, content, fileKey);

    return jsonResponse({ success: true, data: submission }, 201);
  } catch (error: any) {
    return errorResponse(error?.message || 'خطا در ارسال پاسخ', 400);
  }
};

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new AssignmentService(env);
  const assignments = (await service.getStudentAssignments(req.user!.id, req.user!.school_id!)) as any[];

  return jsonResponse({
    success: true,
    data: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      due_date: a.due_date,
      status: a.submission_status || 'not_submitted',
      content: a.submission_content || null,
      grade: a.submission_grade ?? null,
      feedback: a.submission_feedback || null,
    })),
  });
};

export const submitAnswer = withAuth(withRole(['student'])(withTenant(submitHandler)));
export const getSubmissions = withAuth(withRole(['student'])(withTenant(listHandler)));
