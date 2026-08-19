import { AppRequest, Env } from '../types';
import { errorResponse } from '../utils/response';
import { requireFields } from '../utils/validators';

type Handler = (request: AppRequest, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

/**
 * بدنه JSON درخواست را می‌خواند، فیلدهای الزامی را بررسی می‌کند،
 * و آن را روی request._body می‌گذارد تا handler دوباره req.json() صدا نزند
 * (چون بدنه Request فقط یک‌بار قابل خواندن است).
 */
export const withValidation = (requiredFields: string[]) => {
  return (handler: Handler): Handler => {
    return async (request, env, ctx) => {
      let body: Record<string, any>;
      try {
        body = await request.json();
      } catch {
        return errorResponse('بدنه درخواست JSON معتبر نیست', 400);
      }

      const { valid, missing } = requireFields(body, requiredFields);
      if (!valid) {
        return errorResponse(`فیلدهای الزامی وارد نشده: ${missing.join('، ')}`, 400);
      }

      (request as any)._body = body;
      return handler(request, env, ctx);
    };
  };
};
