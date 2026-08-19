import { Env } from '../../types';
import { AuthService } from '../../services/authService';
import { jsonResponse, errorResponse } from '../../utils/response';
import { isValidEmail, isNonEmptyString, requireFields } from '../../utils/validators';

export const login = async (request: Request, env: Env) => {
  try {
    const body = (await request.json()) as any;
    const { role } = body;
    const authService = new AuthService(env);

    if (role === 'teacher') {
      const { email, password } = body;
      const { valid, missing } = requireFields(body, ['email', 'password']);
      if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

      const result = await authService.loginTeacher(email, password);
      if (!result) return errorResponse('ایمیل یا رمز عبور اشتباه است', 401);
      return jsonResponse({ success: true, token: result.token, user: result.user });
    }

    if (role === 'student') {
      const { studentId, loginCode } = body;
      const { valid, missing } = requireFields(body, ['studentId', 'loginCode']);
      if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

      const result = await authService.loginStudent(studentId, loginCode);
      if (!result) return errorResponse('شناسه یا کد ورود اشتباه است', 401);
      return jsonResponse({ success: true, token: result.token, user: result.user });
    }

    if (role === 'admin') {
      const { email, password } = body;
      const { valid, missing } = requireFields(body, ['email', 'password']);
      if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

      const result = await authService.loginAdmin(email, password);
      if (!result) return errorResponse('ایمیل یا رمز عبور اشتباه است', 401);
      return jsonResponse({ success: true, token: result.token, user: result.user });
    }

    return errorResponse('نقش نامعتبر است (teacher | student | admin)', 400);
  } catch (error) {
    return errorResponse('خطا در ورود', 500);
  }
};

export const register = async (request: Request, env: Env) => {
  try {
    const body = (await request.json()) as any;
    const { name, email, password, school_id } = body;

    const { valid, missing } = requireFields(body, ['name', 'email', 'password', 'school_id']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);
    if (!isValidEmail(email)) return errorResponse('ایمیل نامعتبر است', 400);
    if (!isNonEmptyString(password) || password.length < 8) {
      return errorResponse('رمز عبور باید حداقل ۸ کاراکتر باشد', 400);
    }

    const authService = new AuthService(env);
    const user = await authService.registerTeacher({ name, email, password, school_id });

    return jsonResponse({ success: true, user }, 201);
  } catch (error: any) {
    return errorResponse(error?.message || 'خطا در ثبت‌نام', 400);
  }
};
