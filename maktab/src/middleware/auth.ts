import { AppRequest, Env, UserRole } from '../types';
import { unauthorizedResponse } from '../utils/response';
import { AuthService } from '../services/authService';

type Handler = (request: AppRequest, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

export const withAuth = (handler: Handler): Handler => {
  return async (request, env, ctx) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return unauthorizedResponse('توکن ارائه نشده است');
    }

    const authService = new AuthService(env);
    const payload = await authService.verifyToken(token);

    if (!payload) {
      return unauthorizedResponse('توکن نامعتبر یا منقضی است');
    }

    request.user = {
      id: payload.id as string,
      role: payload.role as UserRole,
      school_id: payload.school_id as string | undefined,
      class_id: payload.class_id as string | undefined,
    };

    return handler(request, env, ctx);
  };
};

export const withRole = (roles: UserRole[]) => {
  return (handler: Handler): Handler => {
    return async (request, env, ctx) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return unauthorizedResponse('دسترسی غیرمجاز');
      }
      return handler(request, env, ctx);
    };
  };
};
