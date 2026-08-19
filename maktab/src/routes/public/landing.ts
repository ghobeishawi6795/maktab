import { jsonResponse } from '../../utils/response';

export const landing = async (request: Request) => {
  return jsonResponse({
    success: true,
    data: {
      name: 'مکتب',
      tagline: 'سامانه ساده ارسال و مدیریت تکلیف برای معلمان ابتدایی',
      features: [
        'ساخت تکلیف در چند مرحله ساده',
        'پاسخ متنی، صوتی، تصویری و تعاملی',
        'بازخورد و نمره‌دهی سریع',
        'گزارش عملکرد کلاس و دانش‌آموز',
      ],
    },
  });
};

export const pricing = async (request: Request) => {
  return jsonResponse({
    success: true,
    data: {
      plans: [
        { id: 'trial', name: 'آزمایشی', price: 0, duration_days: 14 },
        { id: 'basic', name: 'پایه', price: 190000, duration_days: 30 },
        { id: 'pro', name: 'حرفه‌ای', price: 390000, duration_days: 30 },
      ],
    },
  });
};
