import { AppRequest, Env } from '../../types';
import { SchoolService } from '../../services/schoolService';
import { jsonResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { withAuth, withRole } from '../../middleware/auth';
import { requireFields } from '../../utils/validators';

const listHandler = async (req: AppRequest, env: Env) => {
  const service = new SchoolService(env);
  const schools = await service.listAll();
  return jsonResponse({ success: true, data: schools });
};

const createHandler = async (req: AppRequest, env: Env) => {
  try {
    const body = (await req.json()) as any;
    const { valid, missing } = requireFields(body, ['name']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

    const service = new SchoolService(env);
    const school = await service.create({ name: body.name, domain: body.domain, plan: body.plan });
    return jsonResponse({ success: true, data: school }, 201);
  } catch (error) {
    return errorResponse('خطا در ایجاد مدرسه', 500);
  }
};

const getHandler = async (req: AppRequest, env: Env) => {
  const service = new SchoolService(env);
  const school = await service.getById(req.params.id);
  if (!school) return notFoundResponse('مدرسه یافت نشد');
  return jsonResponse({ success: true, data: school });
};

const updatePlanHandler = async (req: AppRequest, env: Env) => {
  try {
    const body = (await req.json()) as any;
    const { valid, missing } = requireFields(body, ['plan']);
    if (!valid) return errorResponse(`فیلدهای الزامی: ${missing.join('، ')}`, 400);

    const service = new SchoolService(env);
    const school = await service.getById(req.params.id);
    if (!school) return notFoundResponse('مدرسه یافت نشد');

    const updated = await service.updatePlan(req.params.id, body.plan);
    return jsonResponse({ success: true, data: updated });
  } catch (error) {
    return errorResponse('خطا در بروزرسانی', 500);
  }
};

export const listSchools = withAuth(withRole(['admin'])(listHandler));
export const createSchool = withAuth(withRole(['admin'])(createHandler));
export const getSchool = withAuth(withRole(['admin'])(getHandler));
export const updateSchoolPlan = withAuth(withRole(['admin'])(updatePlanHandler));
