-- این فایل فقط داده‌های غیرحساس (بدون رمز عبور) را seed می‌کند.
-- برای ساخت معلم واقعی با رمز صحیح، بعد از دیپلوی از /api/auth/register استفاده کن
-- (نمونه در پایین همین فایل، بخش «نحوه ساخت معلم نمونه»).

-- مدرسه نمونه
INSERT INTO schools (id, name, domain) VALUES
('school-1', 'مدرسه نمونه الف', 'sample.school.ir');

-- کلاس نمونه (teacher_id بعداً بعد از ثبت‌نام معلم آپدیت می‌شود)
-- توجه: چون teacher_id در جدول classes الزامی (NOT NULL) است، این INSERT را
-- بعد از ساخت معلم واقعی از طریق register اجرا کن (یا مقدار teacher_id را جایگزین کن).

-- دانش‌آموزان نمونه (login_code = کد ورود ساده که به ولی دانش‌آموز اعلام می‌شود)
INSERT INTO students (id, school_id, class_id, name, parent_phone, login_code) VALUES
('student-1', 'school-1', 'class-1', 'علی محمدی', '09121111111', '1234'),
('student-2', 'school-1', 'class-1', 'زهرا کریمی', '09122222222', '5678'),
('student-3', 'school-1', 'class-1', 'سارا حسینی', '09123333333', '9012');

-- =========================================================
-- نحوه ساخت معلم نمونه (بعد از wrangler dev یا deploy):
--
-- curl -X POST http://localhost:8787/api/auth/register \
--   -H "Content-Type: application/json" \
--   -d '{"name":"خانم احمدی","email":"ahmadi@school.ir","password":"password123","school_id":"school-1"}'
--
-- سپس با همان ایمیل/رمز وارد شو و کلاس را از طریق API بساز، یا دستی:
--
-- INSERT INTO classes (id, school_id, teacher_id, name, grade)
-- VALUES ('class-1', 'school-1', '<teacher-id-واقعی>', 'کلاس سوم الف', 3);
-- =========================================================
