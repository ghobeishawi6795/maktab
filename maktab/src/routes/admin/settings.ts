import { AppRequest, Env } from '../../types';
import { jsonResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';

/**
 * تنظیمات کلی سامانه در سطح ادمین.
 * عمداً endpoint عمومی برای ساخت ادمین جدید وجود ندارد — ادمین‌ها باید
 * مستقیماً با wrangler d1 execute اضافه شوند تا کسی از بیرون نتواند
 * برای خودش حساب ادمین بسازد.
 */
const getHandler = async (req: AppRequest, env: Env) => {
  return jsonResponse({
    success: true,
    data: {
      app_name: 'مکتب',
      version: '1.0.0',
    },
  });
};

export const getSettings = withAuth(withRole(['admin'])(getHandler));
