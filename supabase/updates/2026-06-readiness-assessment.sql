-- Run this in Supabase SQL Editor for an existing CyberCultX database.
-- It adds video recommendation score ranges and installs the real 8-question readiness assessment.

alter table courses add column if not exists video_url text;
alter table courses add column if not exists min_score integer;
alter table courses add column if not exists max_score integer;

update assessments
set type = 'archived_cyber_behavior'
where type = 'cyber_behavior';

do $$
declare
  readiness_id integer;
begin
  select id into readiness_id
  from assessments
  where type = 'psychometric'
  order by id
  limit 1;

  if readiness_id is null then
    insert into assessments (type, title, description, estimated_minutes)
    values (
      'psychometric',
      'تقييم الجاهزية الأمنية من CyberCultX',
      'ثمانية سيناريوهات سلوكية تُستخدم لتخصيص توصيات التدريب الأمني.',
      8
    )
    returning id into readiness_id;
  end if;

  update assessments
  set
    title = 'تقييم الجاهزية الأمنية من CyberCultX',
    description = 'ثمانية سيناريوهات سلوكية تُستخدم لتخصيص توصيات التدريب الأمني.',
    estimated_minutes = 8
  where id = readiness_id;

  delete from assessment_questions where assessment_id = readiness_id;

  insert into assessment_questions (assessment_id, text, category, options, weight, display_order)
  values
  (readiness_id, 'تتلقى بريداً إلكترونياً عاجلاً من مديرك يطلب منك مراجعة ملف مرفق فوراً.', 'phishing_recognition', '[{"value":1,"label":"افتح المرفق فوراً."},{"value":3,"label":"ارسل رداً تسأل فيه إن كان البريد حقيقياً قبل الفتح."},{"value":4,"label":"تحقق من المرسل، وافحص البريد بعناية، وأكد الطلب عبر قناة تواصل أخرى."},{"value":2,"label":"أعد توجيهه إلى زميل واسأله عن رأيه."}]'::jsonb, 1, 1),
  (readiness_id, 'يُطلب منك إنشاء كلمة مرور لتطبيق عمل جديد.', 'password_hygiene', '[{"value":1,"label":"استخدم نفس كلمة المرور التي تستخدمها في أماكن أخرى."},{"value":2,"label":"أضف أرقاماً إلى كلمة مرورك الحالية."},{"value":3,"label":"أنشئ كلمة مرور فريدة بنمط يسهل تذكره."},{"value":4,"label":"استخدم مدير كلمات مرور لإنشاء وحفظ كلمة مرور قوية وفريدة."}]'::jsonb, 1, 2),
  (readiness_id, 'تتلقى رمز QR من مصدر غير معروف يدّعي أنك فزت بمكافأة.', 'qr_safety', '[{"value":1,"label":"امسحه ضوئياً فوراً."},{"value":2,"label":"تجاهله دون الإبلاغ عنه."},{"value":3,"label":"تحقق من المصدر قبل مسحه."},{"value":4,"label":"أبلغ عنه كأمر مشبوه وتجنب التفاعل معه."}]'::jsonb, 1, 3),
  (readiness_id, 'أثناء العمل عن بُعد، تحتاج إلى الإنترنت ولا يتوفر إلا اتصال Wi‑Fi عام.', 'remote_work', '[{"value":1,"label":"اتصل مباشرة وتابع العمل."},{"value":2,"label":"تجنب الأنشطة الحساسة لكن استمر في التصفح."},{"value":3,"label":"استخدم VPN قبل الاتصال بموارد الشركة."},{"value":4,"label":"استخدم نقطة اتصال موثوقة أو VPN واتبع سياسة الوصول عن بُعد في الشركة."}]'::jsonb, 1, 4),
  (readiness_id, 'تلاحظ أن زميلاً يشارك معلومات حساسة للشركة في محادثة عامة.', 'data_handling', '[{"value":1,"label":"تجاهل الأمر."},{"value":2,"label":"اذكره له بشكل خاص لاحقاً."},{"value":3,"label":"أبلغ مديرك فوراً."},{"value":4,"label":"اتبع إجراءات الإبلاغ في الشركة وتأكد من معالجة الخطر."}]'::jsonb, 1, 5),
  (readiness_id, 'تفتح صفحة تسجيل دخول تبدو مطابقة تماماً لبوابة شركتك.', 'credential_safety', '[{"value":1,"label":"أدخل بيانات الدخول فوراً."},{"value":2,"label":"تحقق من شعار الشركة فقط."},{"value":3,"label":"تحقق أولاً من الرابط ومؤشرات الأمان."},{"value":4,"label":"تحقق من الرابط والشهادة وصحة النطاق، وادخل عبر القنوات الرسمية."}]'::jsonb, 1, 6),
  (readiness_id, 'يطلب منك زميل استخدام بيانات حسابك لإنجاز مهمة عاجلة.', 'access_control', '[{"value":1,"label":"شاركها معه مؤقتاً."},{"value":2,"label":"شاركها فقط إذا كان زميلاً موثوقاً."},{"value":3,"label":"ارفض واقترح طلب صلاحية مناسبة."},{"value":4,"label":"ارفض، واشرح متطلبات السياسة، ووجهه إلى إجراء طلب الصلاحيات المعتمد."}]'::jsonb, 1, 7),
  (readiness_id, 'تلاحظ نشاطاً غير معتاد على حسابك المؤسسي.', 'incident_response', '[{"value":1,"label":"تجاهله وراقبه لاحقاً."},{"value":2,"label":"غيّر كلمة المرور فقط."},{"value":3,"label":"غيّر كلمة المرور وأبلغ قسم تقنية المعلومات."},{"value":4,"label":"أبلغ عن الحادث فوراً، وأمّن الحساب، واتبع إجراءات الاستجابة للحوادث في المؤسسة."}]'::jsonb, 1, 8);
end $$;
