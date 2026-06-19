/**
 * Arabic & GCC seed data:
 * - Arabic phishing templates (language: "ar")
 * - Executive and HR role users with GCC names
 */
import { db } from "@workspace/db";
import {
  phishingTemplatesTable,
  usersTable,
  departmentsTable,
} from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const AR_TEMPLATES = [
  // Banking/Finance Arabic
  {
    n: "تحديث بيانات البنك الأهلي",
    t: "email",
    s: "[عاجل] تحديث بيانات حسابك البنكي - البنك الأهلي السعودي",
    b: "عزيزنا العميل،\n\nنُحيطكم علماً بأنه تم رصد نشاط مشبوه على حسابكم البنكي. يرجى التحقق من هويتكم خلال 24 ساعة لتجنب تعليق الحساب.\n\nانقر للتحقق: https://alahli-secure.account-verify.net/ar\n\nفريق الأمن - البنك الأهلي السعودي",
    cat: "banking",
    ind: "finance",
    d: 3,
  },
  {
    n: "تنبيه تحويل الراتب - بنك الراجحي",
    t: "email",
    s: "تم تعليق تحويل راتبك - مطلوب إجراء فوري",
    b: "عزيزي الموظف،\n\nتم تعليق تحويل راتبك بمبلغ 12,500 ريال بسبب مراجعة الامتثال. يرجى التحقق من بياناتك على الرابط التالي لإتمام الإيداع:\n\nhttps://rajhi-payroll.salary-release.net/ar\n\nشكراً لتفهمكم\nإدارة الرواتب - بنك الراجحي",
    cat: "payroll",
    ind: "finance",
    d: 3,
  },
  {
    n: "رسالة OTP مصرف الإمارات الإسلامي",
    t: "sms",
    s: null,
    b: "[مصرف الإمارات الإسلامي] تم تعليق حسابك مؤقتاً. تحقق الآن: https://eib-secure.verify-ae.com/otp",
    cat: "banking",
    ind: "finance",
    d: 2,
  },
  {
    n: "تحديث KYC الإلزامي - بنك دبي الإسلامي",
    t: "email",
    s: "تحديث بيانات اعرف عميلك - إلزامي خلال 48 ساعة",
    b: "وفقاً لمتطلبات مصرف الإمارات العربية المتحدة المركزي، يجب على جميع العملاء تحديث بيانات التحقق من الهوية.\n\nيرجى تحديث بياناتك على: https://dib-kyc.compliance-uae.net/ar\n\nالإخفاق في الامتثال سيؤدي إلى تقييد الحساب.\n\nإدارة الامتثال - بنك دبي الإسلامي",
    cat: "banking",
    ind: "finance",
    d: 4,
  },
  // Government Arabic
  {
    n: "تحديث الهوية الوطنية - وزارة الداخلية",
    t: "email",
    s: "[وزارة الداخلية] تحديث الهوية الوطنية - إجراء عاجل",
    b: "يشرفنا إخطاركم بضرورة تحديث بيانات هويتكم الوطنية في أقرب وقت ممكن لتجنب تعليق الخدمات الحكومية.\n\nتحديث البيانات: https://mol-id.gov-services.ae/update\n\nوزارة الداخلية - دائرة الإقامة",
    cat: "government",
    ind: "government",
    d: 4,
  },
  {
    n: "مخالفة مرورية - هيئة الطرق والمواصلات",
    t: "sms",
    s: null,
    b: "[RTA دبي] مخالفة مرورية بقيمة 800 درهم. ادفع الآن لتجنب تعليق الرخصة: https://rta-fine.payment-ae.com/pay",
    cat: "government",
    ind: "government",
    d: 2,
  },
  {
    n: "إشعار غرامة بلدية دبي",
    t: "email",
    s: "إشعار مخالفة بنائية - غرامة 15,000 درهم",
    b: "تم رصد مخالفة في عقاركم تستوجب دفع غرامة قدرها 15,000 درهم خلال 7 أيام لتجنب الإجراءات القانونية.\n\nللاعتراض أو الدفع: https://dm-fines.municipality-dubai.net/ar\n\nبلدية دبي - قسم التنفيذ",
    cat: "government",
    ind: "government",
    d: 3,
  },
  {
    n: "شكوى عمالية - وزارة الموارد البشرية",
    t: "email",
    s: "تم تقديم شكوى عمالية ضد شركتكم - رد عاجل مطلوب",
    b: "تم تقديم شكوى رسمية لوزارة الموارد البشرية والتوطين. يُطلب منكم الرد خلال 5 أيام عمل.\n\nعرض تفاصيل الشكوى: https://mohre-complaint.labor-uae.net/ar\n\nالإدارة القانونية - وزارة الموارد البشرية",
    cat: "government",
    ind: "government",
    d: 4,
  },
  // HR/Payroll Arabic
  {
    n: "تحديث سياسة العمل عن بُعد",
    t: "email",
    s: "تحديث سياسة العمل من المنزل - التوقيع مطلوب اليوم",
    b: "تم تحديث سياسة العمل عن بُعد وتسري من يوم الاثنين القادم. يجب على جميع الموظفين التوقيع على الشروط المحدثة بحلول الساعة 6 مساءً اليوم.\n\nعرض والتوقيع: https://hr-policy.wfh-acknowledge.com/ar\n\nالإدارة العليا",
    cat: "hr",
    ind: "technology",
    d: 2,
  },
  {
    n: "إشعار صرف المكافأة السنوية",
    t: "email",
    s: "مكافأتك السنوية جاهزة - بيانات الحساب البنكي مطلوبة",
    b: "تهانينا! تمت الموافقة على مكافأة أدائك بمبلغ 18,000 درهم. يرجى تقديم بيانات حسابك البنكي لإتمام التحويل.\n\nأدخل البيانات: https://hr-bonus.payroll-release.net/ar\n\nقسم الرواتب",
    cat: "payroll",
    ind: "technology",
    d: 3,
  },
  // BEC Arabic
  {
    n: "طلب تحويل عاجل - المدير التنفيذي",
    t: "bec",
    s: "تحويل مصرفي عاجل - طلب المدير التنفيذي",
    b: "السلام عليكم،\n\nأنا في اجتماع ولا أستطيع التحدث. أحتاج منك معالجة تحويل مصرفي عاجل بمبلغ 485,000 درهم إلى حساب المورد الجديد. هذا أمر سري للغاية.\n\nرقم IBAN: AE070331234567890123456\nالبنك: أبوظبي الإسلامي\nالمستفيد: خليج للحلول التجارية\n\nنفّذ الأمر فوراً وأكّد لي.\n\nأحمد الراشد\nالمدير التنفيذي",
    cat: "bec",
    ind: "finance",
    d: 5,
  },
  {
    n: "تفويض دفع سري - المدير المالي",
    t: "bec",
    s: "رد: دفعة المورد الرابع - موافقتك مطلوبة",
    b: "المورد أكد حاجته للدفع اليوم لتجنب انقطاع الإمدادات. يرجى تفويض تحويل 230,000 درهم عبر بوابة الخدمات المصرفية.\n\nالمورد: استراتيجيك سوليوشنز المنطقة الحرة\nالمبلغ: 230,000 درهم\nالمرجع: Q4-2024-VENDOR\n\nتمت الموافقة الشفهية من المدير المالي.\n\nفاطمة الزعابي\nمساعدة المدير المالي",
    cat: "bec",
    ind: "finance",
    d: 5,
  },
  // Tech Support Arabic
  {
    n: "إعادة تعيين كلمة المرور - قسم تقنية المعلومات",
    t: "email",
    s: "أمن المعلومات: إعادة تعيين كلمة المرور مطلوبة اليوم",
    b: "بسبب تدقيق أمني، يتعين على جميع الموظفين إعادة تعيين كلمات المرور الخاصة بهم من خلال البوابة الآمنة اليوم. الحسابات غير المحدّثة ستُقفل تلقائياً.\n\nإعادة التعيين: https://it-helpdesk.password-reset-secure.net/ar\n\nقسم أمن المعلومات",
    cat: "tech-support",
    ind: "technology",
    d: 2,
  },
  {
    n: "انتهاء صلاحية برنامج الحماية",
    t: "email",
    s: "تحذير: انتهت صلاحية برنامج الحماية من الفيروسات",
    b: "انتهت صلاحية ترخيص الحماية على جهازك أمس. جهازك الآن غير محمي. جدّد الاشتراك فوراً لتجنب الإصابة بالفيروسات.\n\nتجديد الاشتراك: https://antivirus-renew.endpoint-protect.net/ar\nسعر خاص: 299 درهم/سنة\n\nفريق الأمن",
    cat: "tech-support",
    ind: "technology",
    d: 2,
  },
  // WhatsApp Arabic
  {
    n: "تعليق حساب واتساب",
    t: "sms",
    s: null,
    b: "[واتساب] سيتم تعليق حسابك خلال 24 ساعة. تحقق الآن للإبقاء على نشاط حسابك: https://whatsapp-verify.account-secure.net/ar",
    cat: "whatsapp",
    ind: "telecom",
    d: 2,
  },
  {
    n: "دعوة واتساب الذهبي",
    t: "sms",
    s: null,
    b: "تمت دعوتك للترقية إلى واتساب الذهبي مع مزايا حصرية! اقبل الدعوة: https://wa-gold.premium-invite.net/ar",
    cat: "whatsapp",
    ind: "telecom",
    d: 1,
  },
  // QR Arabic
  {
    n: "رمز QR عداد الانتظار",
    t: "qr",
    s: null,
    b: "رمز QR مزيف يوجّه إلى بوابة دفع وهمية لرسوم الانتظار. المسح يؤدي إلى: https://parking-pay.uae-meter.net/ar",
    cat: "qr",
    ind: "government",
    d: 3,
  },
];

const GCC_EXECUTIVE_USERS = [
  { firstName: "خالد", lastName: "المنصوري", email: "k.almansoori@cybercultx.com", jobTitle: "Chief Executive Officer", role: "executive" },
  { firstName: "نورة", lastName: "الرشيد", email: "n.alrashid@cybercultx.com", jobTitle: "Chief Risk Officer", role: "executive" },
  { firstName: "سعيد", lastName: "الظاهري", email: "s.alzaheri@cybercultx.com", jobTitle: "Chief Information Security Officer", role: "executive" },
  { firstName: "مريم", lastName: "الشامسي", email: "m.alshamsi@cybercultx.com", jobTitle: "Chief Financial Officer", role: "executive" },
];

const GCC_HR_USERS = [
  { firstName: "هيفاء", lastName: "الزعابي", email: "h.alzaabi@cybercultx.com", jobTitle: "HR Director", role: "hr" },
  { firstName: "محمد", lastName: "البلوشي", email: "m.albalushi@cybercultx.com", jobTitle: "HR Manager - Risk & Compliance", role: "hr" },
];

async function seedArabic() {
  console.log("🌙 Seeding Arabic phishing templates...");
  const existing = await db.select({ count: count() }).from(phishingTemplatesTable)
    .where(eq(phishingTemplatesTable.language, "ar"));

  if ((existing[0]?.count ?? 0) >= 10) {
    console.log("  ✓ Arabic templates already seeded");
  } else {
    const values = AR_TEMPLATES.map((t) => ({
      name: t.n,
      type: t.t as any,
      subject: t.s,
      body: t.b,
      language: "ar" as const,
      category: t.cat,
      industry: t.ind,
      difficulty: t.d,
      isAiGenerated: 0,
    }));
    await db.insert(phishingTemplatesTable).values(values).onConflictDoNothing();
    console.log(`  ✓ Seeded ${values.length} Arabic phishing templates`);
  }

  console.log("👤 Seeding GCC Executive & HR users...");
  const [dept] = await db.select({ id: departmentsTable.id })
    .from(departmentsTable)
    .limit(1);

  const passwordHash = await bcrypt.hash("Test1234!", 10);
  const allGccUsers = [...GCC_EXECUTIVE_USERS, ...GCC_HR_USERS];

  for (const u of allGccUsers) {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ✓ ${u.email} already exists`);
      continue;
    }

    await db.insert(usersTable).values({
      email: u.email,
      passwordHash,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      jobTitle: u.jobTitle,
      departmentId: dept?.id ?? null,
      onboardingCompleted: true,
    });
    console.log(`  ✓ Created ${u.role}: ${u.email}`);
  }

  console.log("✅ Arabic seed complete!");
}

seedArabic()
  .then(() => process.exit(0))
  .catch((err) => { console.error("❌ Arabic seed failed:", err); process.exit(1); });
