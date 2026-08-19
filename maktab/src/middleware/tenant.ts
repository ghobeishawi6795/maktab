import { AppRequest, Env } from '../types';
import { errorResponse } from '../utils/response';

type Handler = (request: AppRequest, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

/**
 * تضمین می‌کند کاربر احراز‌هویت‌شده به یک مدرسه معتبر تعلق دارد.
 * باید بعد از withAuth استفاده شود چون به request.user.school_id نیاز دارد.
 */
export const withTenant = (handler: Handler): Handler => {
  return async (request, env, ctx) => {
    const schoolId = request.user?.school_id;

    if (!schoolId) {
      return errorResponse('شناسه مدرسه مشخص نشده است', 400);
    }

    const school = await env.DB.prepare('SELECT id FROM schools WHERE id = ?').bind(schoolId).first();

    if (!school) {
      return errorResponse('مدرسه یافت نشد', 404);
    }

    return handler(request, env, ctx);
  };
};
