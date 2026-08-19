# مکتب — بک‌اند (Cloudflare Workers + D1 + R2)

## ✅ چه چیزهایی نسبت به نسخه قبلی درست شد

1. **باگ‌های پرانتزی که کد را از کامپایل می‌انداختن** در `student/dashboard.ts` و
   `student/submission.ts` تصحیح شد. الگوی همه‌ی route handlerها الان یکسان است.
2. **همه‌ی فایل‌های گمشده نوشته شدند** — قبلاً `index.ts` به ۱۵+ فایل غیرموجود
   (`landing.ts`, کل `admin/*`, `classes.ts`, `students.ts`, `reports.ts`, و...)
   import می‌زد که اصلاً وجود نداشتند و پروژه build نمی‌شد.
3. **`jsonwebtoken` با `jose` جایگزین شد.** `jsonwebtoken` به ماژول `crypto` نود
   وابسته است که در Cloudflare Workers بدون `nodejs_compat` کار نمی‌کند. `jose`
   بر پایه‌ی Web Crypto است و بومی Workers است.
4. **لاگین دانش‌آموز حالا نیاز به `login_code` هم دارد**، نه فقط شناسه‌ی عددی/UUID
   که در URL و جاهای دیگر قابل مشاهده است.
5. **`X-School-ID` header حذف شد.** قبلاً چندمستاجری با یک header که کلاینت
   خودش می‌فرستاد کنترل می‌شد — یعنی هرکسی می‌توانست با تغییر header ادعا کند
   عضو مدرسه‌ی دیگری است. الان `school_id` همیشه از JWT امضاشده گرفته می‌شود.
6. **پارس دستی URL (`split('/')`) حذف شد** و به‌جایش از `req.params` که
   itty-router خودش پر می‌کند استفاده شده — پایدارتر و امن‌تر.
7. **بررسی مالکیت (ownership checks) اضافه شد:** قبلاً یک معلم تئوریاً می‌توانست
   با حدس‌زدن ID، به تکلیف/کلاس معلم دیگری در همان یا مدرسه‌ی دیگر دسترسی پیدا کند.
8. **اعتبارسنجی ورودی (validation)** به همه‌ی route های ایجاد/ویرایش اضافه شد.
9. **CORS** که کلاً غایب بود اضافه شد.
10. **محدودیت حجم و نوع فایل آپلودی** در `fileService` اضافه شد.
11. `seed-data.sql` دیگر یک `password_hash` جعلی ندارد (چون واقعاً bcrypt نبود)
    — به‌جایش راهنمای ساخت معلم واقعی از طریق `/api/auth/register` آمده.

## ⚠️ چیزهایی که هنوز نیاز به کار تو دارند

- **ساخت اولین ادمین**: عمداً endpoint عمومی برای ساخت ادمین نگذاشتم (امنیتی).
  باید مستقیم با `wrangler d1 execute` یک ردیف در جدول `admins` اضافه کنی؛
  رمز را از قبل با bcrypt هش کن (مثلاً با یک اسکریپت Node موقت محلی).
- **تست خودکار**: هیچ تستی (unit/integration) نوشته نشده.
- **Rate limiting**: پیاده نشده — برای جلوگیری از brute-force روی لاگین دانش‌آموز
  (کد ۴ رقمی) توصیه می‌شود.
- **این کد کامپایل نشده و تست نشده** چون این محیط به npm registry دسترسی ندارد؛
  حتماً قبل از دیپلوی `npm install && npm run build` را لوکال اجرا کن.

## 🚀 راه‌اندازی

```bash
npm install
npx wrangler d1 create maktab-db
# database_id خروجی را در wrangler.toml جایگزین کن
npm run db:migrate
npm run db:seed
npm run dev
```

ساخت معلم نمونه بعد از بالا آمدن سرور:

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"student","studentId":"student-1","loginCode":"1234"}'
```

جزئیات کامل در انتهای `seed-data.sql`.
