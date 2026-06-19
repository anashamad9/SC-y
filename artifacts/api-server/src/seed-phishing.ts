import { db } from "@workspace/db";
import {
  phishingTemplatesTable, phishingCampaignsTable, phishingResultsTable,
  tenantsTable, systemConfigTable, usersTable,
} from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const phishingTypes = ["email", "sms", "qr", "login", "bec", "invoice", "deepfake"] as const;
const languages = ["en", "ar"] as const;
const industries = ["finance", "government", "healthcare", "technology", "retail", "energy", "telecom"] as const;
const categories = ["banking", "government", "hr", "payroll", "invoice", "delivery", "whatsapp", "qr", "bec", "covid", "tech-support"] as const;

const EN_TEMPLATES = [
  // Banking/Finance
  { n: "HSBC Account Verification", t: "email", s: "[URGENT] Verify your HSBC online banking access", b: "Dear Valued Customer,\n\nWe have detected suspicious activity on your HSBC account. To prevent unauthorized access, please verify your identity within 24 hours.\n\nVerify now: https://secure-hsbc-verify.account-protection.net/auth\n\nHSBC Security Team", cat: "banking", ind: "finance", d: 3 },
  { n: "Emirates NBD OTP Request", t: "sms", s: null, b: "[Emirates NBD] Your account has been temporarily suspended. Verify now: https://enbd-secure.verify-now.com/otp", cat: "banking", ind: "finance", d: 2 },
  { n: "FAB Salary Transfer Alert", t: "email", s: "Your salary transfer has been held - Action required", b: "Dear Employee,\n\nYour salary transfer of AED 18,500 has been placed on hold due to a compliance review. To release your funds, please verify your account details at: https://fab-compliance.salary-release.net\n\nFirst Abu Dhabi Bank", cat: "payroll", ind: "finance", d: 3 },
  { n: "Dubai Islamic Bank KYC", t: "email", s: "Mandatory KYC Update - Complete within 48 hours", b: "As part of UAE Central Bank regulations, all customers must complete KYC verification by the deadline. Please update your information at: https://dib-kyc.compliance-uae.net\n\nFailure to comply will result in account restriction.\n\nDIB Compliance Team", cat: "banking", ind: "finance", d: 4 },
  { n: "Crypto Investment Opportunity", t: "email", s: "Exclusive: 40% monthly returns - Limited positions available", b: "Our AI-powered trading system has generated AED 2.3M for early investors this month. Secure your position now with a minimum investment of AED 5,000.\n\nRegister: https://ai-crypto-returns.investment-uae.com\n\nDisclaimer: Past performance guarantees future results.", cat: "banking", ind: "finance", d: 4 },
  // Government
  { n: "UAE PASS Verification", t: "email", s: "[UAE PASS] Critical Security Update Required", b: "Your UAE PASS digital identity requires immediate verification to maintain access to government services. Complete verification at: https://uae-pass-secure.gov-verify.net\n\nMinistry of Interior", cat: "government", ind: "government", d: 4 },
  { n: "ICP Visa Status Update", t: "email", s: "Your UAE visa application - Documents required", b: "Dear Applicant,\n\nYour visa application #UAE-2024-88741 requires additional documentation. Please submit the required documents within 72 hours to avoid rejection.\n\nSubmit here: https://icp-visa.documents-required.ae\n\nICA - Identity & Citizenship Authority", cat: "government", ind: "government", d: 3 },
  { n: "RTA Traffic Fine Payment", t: "sms", s: null, b: "[RTA Dubai] Traffic fine of AED 800 is due. Pay now to avoid license suspension: https://rta-fine.payment-secure.ae/pay", cat: "government", ind: "government", d: 2 },
  { n: "MOHRE Labor Complaint", t: "email", s: "Labor complaint filed against your company - Urgent response required", b: "A formal labor complaint has been filed with the Ministry of Human Resources. You are required to respond within 5 business days.\n\nView complaint details: https://mohre-complaint.labor-uae.net/cases\n\nMOHRE Legal Department", cat: "government", ind: "government", d: 4 },
  { n: "Dubai Municipality Fine", t: "email", s: "Property violation notice - AED 15,000 fine", b: "Your property has been cited for a building code violation. The fine of AED 15,000 must be paid within 7 days to avoid legal action.\n\nDispute or pay: https://dm-fines.dubai-municipality-services.net\n\nDubai Municipality Enforcement", cat: "government", ind: "government", d: 3 },
  // HR/Payroll
  { n: "HR Policy Update", t: "email", s: "Important: Updated HR policies require your acknowledgment", b: "Please review and sign the updated employee policies before end of business today. Failure to sign may affect your employment status.\n\nSign here: https://hr-policies.company-compliance.net\n\nHuman Resources Department", cat: "hr", ind: "technology", d: 2 },
  { n: "Annual Bonus Release", t: "email", s: "Your annual bonus is ready - Bank details required", b: "Congratulations! Your performance bonus of AED 25,000 has been approved. Please provide your preferred bank account details to process the transfer.\n\nSubmit details: https://hr-bonus.payroll-release.net\n\nPayroll Department", cat: "payroll", ind: "technology", d: 3 },
  { n: "Benefits Enrollment Deadline", t: "email", s: "FINAL NOTICE: Benefits enrollment closes at 5pm today", b: "You have not enrolled in the company benefits package for 2025. This is your final notice. Enroll immediately or lose your benefits for the year.\n\nEnroll now: https://benefits.employee-portal-secure.net\n\nHR Benefits Team", cat: "hr", ind: "technology", d: 2 },
  { n: "WFH Policy Change", t: "email", s: "Work from home policy changes - Sign acknowledgment now", b: "New WFH policy takes effect Monday. All employees must acknowledge the updated terms by 6pm today.\n\nView and sign: https://policy-update.wfh-acknowledge.com\n\nManagement", cat: "hr", ind: "technology", d: 2 },
  { n: "Performance Review Request", t: "email", s: "Complete your self-assessment - Due today", b: "Your Q4 performance self-assessment is past due. Complete it now to avoid impact on your performance rating.\n\nComplete here: https://perf-review.hr-self-assessment.net\n\nPeople & Culture", cat: "hr", ind: "technology", d: 1 },
  // Invoice/Finance
  { n: "Microsoft 365 Invoice", t: "invoice", s: "Invoice #MS-2025-44821 - Microsoft 365 renewal AED 45,000", b: "Please find attached the annual Microsoft 365 license renewal invoice. Payment is due within 7 days to avoid service interruption.\n\nPay securely: https://ms365-invoice.microsoft-renewal.net\n\nMicrosoft Volume Licensing", cat: "invoice", ind: "technology", d: 3 },
  { n: "IT Equipment Purchase", t: "invoice", s: "PO #IT-2025-0891 - Approved purchase order for payment", b: "The attached purchase order for IT equipment has been approved by management. Please process payment of AED 89,500 at your earliest convenience.\n\nProcess payment: https://po-payment.it-equipment-uae.net\n\nProcurement Team", cat: "invoice", ind: "technology", d: 4 },
  { n: "Electricity Bill DEWA", t: "email", s: "DEWA: Your bill is overdue - Service disconnection warning", b: "Your electricity account shows an outstanding balance of AED 3,450. Pay now to avoid disconnection.\n\nPay online: https://dewa-payment.utility-services-ae.com\n\nDEWA Customer Service", cat: "invoice", ind: "retail", d: 2 },
  { n: "Legal Services Invoice", t: "invoice", s: "Invoice from Al Tamimi & Company - AED 125,000", b: "Please see the attached invoice for legal services rendered in Q4 2024. Payment is required within 30 days.\n\nView invoice: https://altamimi-invoice.legal-services-ae.net\n\nAccounts Receivable", cat: "invoice", ind: "technology", d: 3 },
  { n: "Cloud Hosting Overdue", t: "email", s: "URGENT: Cloud hosting suspension in 4 hours", b: "Your cloud hosting account has an overdue payment of AED 12,800. Services will be suspended in 4 hours unless payment is made.\n\nPay now: https://cloud-hosting.urgent-payment.net\n\nAWS Billing Team", cat: "invoice", ind: "technology", d: 3 },
  // Delivery
  { n: "Aramex Package Held", t: "sms", s: null, b: "[Aramex] Package held at customs. Pay AED 85 import duty to release: https://aramex-customs.delivery-release.com/pay", cat: "delivery", ind: "retail", d: 2 },
  { n: "DHL Import Duty", t: "email", s: "Your DHL shipment requires customs clearance - AED 320", b: "Your package is being held at Dubai Customs. Please pay the import duty of AED 320 to release your shipment.\n\nPay now: https://dhl-customs.import-clearance.ae\n\nDHL Express UAE", cat: "delivery", ind: "retail", d: 2 },
  { n: "Amazon.ae Delivery Failed", t: "email", s: "Amazon: Delivery failed - Reschedule required", b: "We attempted to deliver your order but were unable to reach you. Please reschedule delivery and verify your address.\n\nReschedule: https://amazon-delivery.reschedule-ae.com\n\nAmazon Logistics UAE", cat: "delivery", ind: "retail", d: 2 },
  { n: "Noon.com Prize Winner", t: "email", s: "Congratulations! You won the Noon Yellow Friday raffle - AED 50,000", b: "You have been selected as a winner in our Yellow Friday promotion. To claim your AED 50,000 prize, please verify your identity and provide your bank details.\n\nClaim here: https://noon-winner.claim-prize.ae\n\nNoon Promotions Team", cat: "delivery", ind: "retail", d: 3 },
  // WhatsApp/Social
  { n: "WhatsApp Account Suspension", t: "sms", s: null, b: "[WhatsApp] Your account will be suspended in 24 hours. Verify here to keep your account active: https://whatsapp-verify.account-secure.net", cat: "whatsapp", ind: "telecom", d: 2 },
  { n: "WhatsApp Gold Invitation", t: "sms", s: null, b: "You've been selected to upgrade to WhatsApp Gold with exclusive features! Accept invitation: https://wa-gold.premium-invite.net", cat: "whatsapp", ind: "telecom", d: 1 },
  { n: "Instagram Verification", t: "email", s: "Your Instagram account has been flagged for review", b: "Your Instagram account @yourname has been flagged for unusual activity. Verify your identity to prevent suspension.\n\nVerify: https://instagram-verify.account-review.net\n\nMeta Security Team", cat: "whatsapp", ind: "technology", d: 3 },
  // QR Attacks
  { n: "QR Parking Meter", t: "qr", s: null, b: "This QR code redirects to a fake parking payment portal. Scanning it leads to: https://dubai-parking.pay-meter.net\n\n[QR code would be placed on parking meters]", cat: "qr", ind: "government", d: 3 },
  { n: "QR Restaurant Menu", t: "qr", s: null, b: "Fake restaurant menu QR that captures credentials. Target URL: https://menu-scan.restaurant-order.ae\n\n[QR placed over legitimate restaurant QR codes]", cat: "qr", ind: "retail", d: 2 },
  { n: "QR Conference Badge", t: "qr", s: null, b: "QR code on conference badge claiming to connect to WiFi or LinkedIn profile. Redirects to: https://conference-connect.attendee-portal.net", cat: "qr", ind: "technology", d: 3 },
  // BEC
  { n: "CEO Payment Request", t: "bec", s: "Urgent wire transfer needed - CEO request", b: "Hi [Name],\n\nI'm in a meeting and can't talk. I need you to process an urgent wire transfer of AED 485,000 to our new supplier account. This is time-sensitive and confidential.\n\nAccount: IBAN AE070331234567890123456\nBank: ADIB\nBeneficiary: Gulf Trading Solutions LLC\n\nProcess immediately and confirm.\n\nAhmed Al Rashid\nCEO", cat: "bec", ind: "finance", d: 5 },
  { n: "CFO Payment Authorization", t: "bec", s: "Re: Q4 vendor payment - your approval needed", b: "The vendor has confirmed they need payment today to avoid supply disruption. Please authorize the transfer of AED 230,000 using the banking portal.\n\nVendor: Strategic Solutions FZCO\nAmount: AED 230,000\nReference: Q4-2024-VENDOR\n\nThis has been verbally approved by the CFO.\n\nFatima Al Zaabi\nExecutive Assistant to CFO", cat: "bec", ind: "finance", d: 5 },
  { n: "Legal Counsel Confidential", t: "bec", s: "[CONFIDENTIAL] Acquisition settlement payment", b: "As per our discussion regarding the confidential acquisition, please process the escrow payment of AED 1.2M today. This must not be discussed with other staff until the deal is announced.\n\nInstructions will follow via separate channel.\n\nMohammad Al Mansoori\nGeneral Counsel", cat: "bec", ind: "technology", d: 5 },
  // Tech Support
  { n: "IT Help Desk Password Reset", t: "email", s: "IT Security: Password reset required by end of day", b: "Due to a security audit, IT requires all users to reset their passwords through our secure portal today. Accounts not updated will be locked.\n\nReset password: https://it-helpdesk.password-reset-secure.net\n\nIT Security Operations", cat: "tech-support", ind: "technology", d: 2 },
  { n: "Antivirus License Expired", t: "email", s: "CRITICAL: Your antivirus protection has expired", b: "Your endpoint protection license expired yesterday. Your device is now unprotected. Renew immediately to avoid infection.\n\nRenew now: https://antivirus-renew.endpoint-protect.net\nSpecial price: AED 299/year\n\nSecurity Team", cat: "tech-support", ind: "technology", d: 2 },
  { n: "VPN Access Revoked", t: "email", s: "VPN access revoked - Re-authenticate required", b: "Your VPN access has been temporarily revoked due to policy compliance. Please re-authenticate your account to restore access.\n\nRe-authenticate: https://vpn-auth.remote-access-secure.net\n\nNetwork Operations Center", cat: "tech-support", ind: "technology", d: 3 },
  { n: "Office 365 Storage Full", t: "email", s: "Your OneDrive is 99% full - Action required", b: "Your OneDrive storage is almost full. Files will stop syncing within 24 hours. Upgrade your storage or delete files now.\n\nUpgrade storage: https://onedrive-upgrade.ms-storage.net\nFree upgrade promo available for 24 hours only!\n\nMicrosoft OneDrive Team", cat: "tech-support", ind: "technology", d: 2 },
  { n: "Two-Factor Auth Disable Request", t: "email", s: "Confirm: Request to disable 2FA on your account", b: "We received a request to disable two-factor authentication on your account. If this was you, click confirm. If not, click deny immediately.\n\nConfirm: https://security.account-2fa.net/confirm?token=abc123\nDeny: https://security.account-2fa.net/deny?token=abc123\n\nSecurity Team", cat: "tech-support", ind: "technology", d: 3 },
  // Healthcare
  { n: "DOH Health Insurance Update", t: "email", s: "Your health insurance card requires renewal - DOH UAE", b: "Your health insurance policy expires in 48 hours. Renew your Daman health card to avoid coverage gaps.\n\nRenew now: https://doh-insurance.health-card-renewal.ae\n\nDepartment of Health Abu Dhabi", cat: "government", ind: "healthcare", d: 3 },
  { n: "COVID Test Result Available", t: "email", s: "Your PCR test result is ready - Action required", b: "Your COVID-19 PCR test result is available. Please download your result certificate to comply with travel requirements.\n\nDownload result: https://pcr-result.health-cert-uae.net\n\nDubai Health Authority", cat: "covid", ind: "healthcare", d: 3 },
  // Energy
  { n: "ADNOC Contractor Portal", t: "email", s: "ADNOC contractor portal - Re-registration required", b: "As part of ADNOC's annual contractor review, all registered contractors must re-validate their credentials by end of month.\n\nRe-register: https://adnoc-contractor.portal-register.ae\n\nADNOC Procurement", cat: "government", ind: "energy", d: 4 },
  // Additional email phishing
  { n: "LinkedIn Job Offer", t: "email", s: "Exciting opportunity at NEOM - AED 85,000/month", b: "I came across your profile and would like to discuss an exceptional opportunity at NEOM. The role offers AED 85,000/month plus housing. Please provide your CV and bank details for the contract.\n\nApply: https://neom-careers.job-apply-sa.net\n\nTalent Acquisition, NEOM", cat: "hr", ind: "technology", d: 3 },
  { n: "Zoom Meeting Credentials", t: "email", s: "Your Zoom account requires verification", b: "We detected unusual sign-in activity on your Zoom account. Verify your credentials to maintain access to all scheduled meetings.\n\nVerify now: https://zoom-secure.meeting-verify.net\n\nZoom Trust & Safety", cat: "tech-support", ind: "technology", d: 2 },
  { n: "Salesforce Access Expiry", t: "email", s: "Salesforce license expiring in 2 days", b: "Your Salesforce user license will expire in 48 hours. Complete the renewal process to maintain access to customer data.\n\nRenew license: https://salesforce-renewal.crm-license.net\n\nSalesforce Administration Team", cat: "tech-support", ind: "technology", d: 3 },
  { n: "Charity Donation Appeal", t: "email", s: "Emergency appeal: Help families in Gaza - Zakat eligible", b: "Your urgent donation is needed. Every AED donated provides food for one displaced family. Donate now and receive your official receipt.\n\nDonate: https://charity-appeal.zakat-donation.ae\n\nHumanitarian Relief Fund", cat: "banking", ind: "government", d: 2 },
  { n: "Free MacBook Pro Raffle", t: "email", s: "You've won! Claim your MacBook Pro", b: "Congratulations! Your email was randomly selected in our customer appreciation raffle. Claim your MacBook Pro M4 by completing verification.\n\nClaim prize: https://apple-raffle.prize-claim.net\nOffer expires in 12 hours!\n\nApple Customer Relations", cat: "delivery", ind: "retail", d: 1 },
  { n: "Etisalat Bill Overdue", t: "sms", s: null, b: "[Etisalat/e&] Your telecom bill of AED 450 is overdue. Pay now to avoid service disconnection: https://etisalat-pay.bill-secure.ae", cat: "invoice", ind: "telecom", d: 2 },
  { n: "Deepfake Video CEO", t: "deepfake", s: "Security briefing: Watch this important message from CEO", b: "[DEEPFAKE SIMULATION] This email contains a link to an AI-generated video of the CEO requesting an urgent wire transfer. The video looks authentic but is synthetic.\n\nWatch message: https://ceo-briefing.secure-video.net\n\n[Detection tip: Always verify financial requests through a secondary channel]", cat: "bec", ind: "finance", d: 5 },
  { n: "Fake Login Page - Google", t: "login", s: "Sign in to Google to view shared document", b: "Someone shared a document with you via Google Drive. Sign in to view it.\n\n[Fake Google login page captures credentials]\nURL: https://google-drive.document-view.net/signin\n\n[The page looks identical to Google's login page]", cat: "tech-support", ind: "technology", d: 3 },
  { n: "Fake Login Page - Microsoft", t: "login", s: "Access your Microsoft 365 shared files", b: "Your colleague has shared an important Excel file with you. Sign in with your Microsoft account to access it.\n\n[Fake Microsoft login]\nURL: https://login.microsoftonline.account-portal.net\n\n[Perfect Microsoft branding replica]", cat: "tech-support", ind: "technology", d: 3 },
];

const AR_TEMPLATES = [
  { n: "تحقق من حساب بنك الإمارات", t: "email", s: "[عاجل] تحقق من حسابك المصرفي", b: "عزيزي العميل،\n\nلقد اكتشفنا نشاطاً مشبوهاً على حسابك. يرجى التحقق من هويتك خلال 24 ساعة لمنع الوصول غير المصرح به.\n\nتحقق الآن: https://enbd-secure.verify-now.ae/ar\n\nفريق أمن بنك الإمارات دبي الوطني", cat: "banking", ind: "finance", d: 3 },
  { n: "تنبيه تحويل راتب FAB", t: "email", s: "تحويل راتبك معلق - مطلوب اتخاذ إجراء", b: "عزيزي الموظف،\n\nتم تعليق تحويل راتبك البالغ 18500 درهم بسبب مراجعة الامتثال. للإفراج عن أموالك، يرجى التحقق من تفاصيل حسابك على: https://fab-compliance.salary-release.net/ar\n\nبنك أبوظبي الأول", cat: "payroll", ind: "finance", d: 3 },
  { n: "تحديث هوية الإمارات", t: "email", s: "تحديث إلزامي للهوية الإماراتية - مطلوب خلال 48 ساعة", b: "يجب على جميع المواطنين والمقيمين تحديث بيانات الهوية الوطنية قبل الموعد النهائي. يرجى إتمام التحديث على: https://ica-id.emirates-id-update.ae\n\nهيئة الهوية والجوازات", cat: "government", ind: "government", d: 4 },
  { n: "غرامة مرور RTA", t: "sms", s: null, b: "[RTA دبي] غرامة مرور بقيمة 800 درهم مستحقة. ادفع الآن لتجنب تعليق الرخصة: https://rta-fines.payment-ae.com/pay", cat: "government", ind: "government", d: 2 },
  { n: "فرصة استثمارية حصرية", t: "email", s: "فرصة استثمارية: عوائد 40% شهرياً", b: "يسعدنا دعوتكم للانضمام إلى برنامجنا الاستثماري المتميز الذي حقق عوائد استثنائية. استثمر من 5000 درهم واحصل على 40% شهرياً.\n\nسجل الآن: https://investment-uae.profit-guaranteed.net\n\nشركة الاستثمار العربي", cat: "banking", ind: "finance", d: 4 },
  { n: "رسالة هيئة العمل MOHRE", t: "email", s: "شكوى عمالية ضد شركتك - رد عاجل مطلوب", b: "تم تقديم شكوى رسمية إلى وزارة الموارد البشرية ضد شركتكم. يتعين عليكم الرد خلال 5 أيام عمل.\n\nعرض تفاصيل الشكوى: https://mohre.complaint-labor.ae/cases\n\nالإدارة القانونية - وزارة الموارد البشرية", cat: "government", ind: "government", d: 4 },
  { n: "تحديث بيانات بنك دبي الإسلامي", t: "email", s: "تحديث بيانات KYC إلزامي - خلال 48 ساعة", b: "استناداً لمتطلبات البنك المركزي الإماراتي، يتعين على جميع العملاء إتمام تحديث بيانات التحقق من الهوية.\n\nتحديث البيانات: https://dib-kyc.compliance-uae.net/ar\n\nفريق الامتثال - بنك دبي الإسلامي", cat: "banking", ind: "finance", d: 4 },
  { n: "مسابقة نون الفائز", t: "email", s: "مبروك! لقد فزت بجائزة نون بقيمة 50000 درهم", b: "تهانينا! تم اختيارك كفائز في مسابقتنا الخاصة. للمطالبة بجائزتك البالغة 50000 درهم، يرجى التحقق من هويتك وتقديم بياناتك البنكية.\n\nالمطالبة بالجائزة: https://noon-winner.claim-ae.net\n\nفريق العروض الترويجية - نون", cat: "delivery", ind: "retail", d: 3 },
  { n: "رسالة واتساب تعليق الحساب", t: "sms", s: null, b: "[واتساب] سيتم تعليق حسابك خلال 24 ساعة. تحقق من هويتك للحفاظ على حسابك: https://wa-verify.account-secure-ae.net", cat: "whatsapp", ind: "telecom", d: 2 },
  { n: "فاتورة ديوا متأخرة", t: "sms", s: null, b: "[ديوا] فاتورتك المستحقة بمبلغ 1,250 درهم. ادفع الآن لتجنب قطع الخدمة: https://dewa-payment.utility-ae.com/pay", cat: "invoice", ind: "retail", d: 2 },
  { n: "طلب تحويل عاجل من المدير", t: "bec", s: "طلب تحويل عاجل وسري - المدير التنفيذي", b: "مرحباً،\n\nأنا في اجتماع ولا أستطيع التحدث. أحتاج منك معالجة تحويل عاجل بمبلغ 485,000 درهم لحساب المورد الجديد. هذا الأمر حساس ومن الضروري أن يظل سرياً.\n\nرقم الحساب: AE070331234567890123456\nالبنك: بنك أبوظبي الإسلامي\nالمستفيد: شركة الخليج للتجارة\n\nالرجاء المعالجة فوراً والتأكيد.\n\nأحمد الراشد\nالمدير التنفيذي", cat: "bec", ind: "finance", d: 5 },
  { n: "تسجيل شركة مجاني", t: "email", s: "عرض حصري: تسجيل شركة في دبي مجاناً", b: "تفضلوا بالاستفادة من عرضنا الحصري لتسجيل شركتكم في مناطق دبي الحرة مجاناً! كل ما تحتاجه هو رسوم المعالجة البالغة 2,000 درهم فقط.\n\nسجل الآن: https://freezone-register.dubai-free.ae\n\nمجموعة دبي للأعمال", cat: "banking", ind: "government", d: 3 },
  { n: "تنبيه أمن منصة UAE PASS", t: "email", s: "[UAE PASS] تحديث أمني حرج مطلوب", b: "تتطلب هويتك الرقمية UAE PASS تحققاً فورياً للحفاظ على وصولك لخدمات الحكومة. أتمم التحقق على: https://uae-pass-secure.gov-verify-ae.net\n\nوزارة الداخلية", cat: "government", ind: "government", d: 4 },
  { n: "بريد مصلحة الضرائب", t: "email", s: "مصلحة الضرائب: مطلوب تقديم مستندات بشكل عاجل", b: "استناداً للتدقيق الضريبي الجاري، مطلوب تقديم مستنداتكم المالية للربع الأخير خلال 72 ساعة.\n\nرفع المستندات: https://tax-authority.documents-submit.ae\n\nهيئة الضرائب الاتحادية", cat: "government", ind: "finance", d: 4 },
  { n: "رمز QR لدفع الفاتورة", t: "qr", s: null, b: "رمز QR مزيف يُوضع في مراكز الخدمة يقود إلى صفحة دفع مزيفة. الرابط المستهدف: https://bill-payment.services-uae.net/qr\n\n[يُوضع فوق رموز QR الشرعية في مراكز خدمة العملاء]", cat: "qr", ind: "government", d: 3 },
  { n: "عرض وظيفة سعودي", t: "email", s: "فرصة عمل في نيوم - 85,000 ريال شهرياً", b: "وجدنا ملفك الوظيفي مناسباً لشاغر في مشروع نيوم. الراتب 85,000 ريال + سكن. أرسل سيرتك الذاتية مع بياناتك البنكية لاستلام عقد العمل.\n\nالتقديم: https://neom-jobs.careers-sa.net/ar\n\nإدارة المواهب - نيوم", cat: "hr", ind: "technology", d: 3 },
  { n: "رسالة التأمين الصحي DHA", t: "email", s: "تحديث بطاقتك الصحية - مطلوب خلال 48 ساعة", b: "تنتهي صلاحية بطاقة التأمين الصحي الخاصة بك خلال 48 ساعة. جدد اشتراكك الآن لتجنب انقطاع التغطية.\n\nتجديد الآن: https://dha-health.insurance-renewal.ae/ar\n\nهيئة الصحة بدبي", cat: "government", ind: "healthcare", d: 3 },
  { n: "تنبيه أرامكس للطرد", t: "sms", s: null, b: "[أرامكس] طردك محتجز في الجمارك. ادفع 85 درهم رسوم الاستيراد لتحريره: https://aramex-customs.delivery-release-ae.com", cat: "delivery", ind: "retail", d: 2 },
  { n: "مكالمة دعم فني مزيفة", t: "email", s: "تحذير: تم اكتشاف فيروس على جهازك", b: "تم اكتشاف فيروس خطير على جهازك. اتصل بفريق الدعم الفني فوراً على +971-4-123-4567 أو قم بتنزيل أداة إزالة الفيروس من: https://virus-remove.tech-support-ae.net\n\nفريق أمن المعلومات", cat: "tech-support", ind: "technology", d: 2 },
  { n: "تبرع خيري طارئ", t: "email", s: "نداء عاجل: ساعد الأسر المتضررة - زكاة مقبولة", b: "تبرعك العاجل مطلوب لمساعدة الأسر النازحة. كل درهم يوفر وجبة لأسرة محتاجة. تبرع الآن واستلم وصل رسمياً.\n\nتبرع: https://charity-urgent.zakat-uae.ae\n\nصندوق الإغاثة الإنسانية", cat: "banking", ind: "government", d: 2 },
];

function makeTemplates() {
  const all = [];
  for (const t of EN_TEMPLATES) {
    all.push({
      name: t.n, type: t.t, subject: t.s ?? null, body: t.b,
      attachmentDesc: t.t === "invoice" ? `Invoice_${Math.floor(Math.random() * 9000) + 1000}.pdf` : null,
      difficulty: t.d, language: "en", industry: t.ind, category: t.cat, isAiGenerated: 0,
    });
  }
  for (const t of AR_TEMPLATES) {
    all.push({
      name: t.n, type: t.t, subject: t.s ?? null, body: t.b,
      attachmentDesc: null, difficulty: t.d, language: "ar", industry: t.ind, category: t.cat, isAiGenerated: 0,
    });
  }
  // Fill to 200 with variations
  const base = [...all];
  while (all.length < 200) {
    const src = base[all.length % base.length];
    all.push({
      ...src,
      name: `${src.name} (Variant ${Math.floor(all.length / base.length) + 1})`,
      difficulty: Math.min(5, Math.max(1, src.difficulty + (Math.random() > 0.5 ? 1 : -1))),
    });
  }
  return all.slice(0, 200);
}

async function seedPhishing() {
  console.log("🎣 Seeding phishing templates...");
  const existing = await db.select({ count: count() }).from(phishingTemplatesTable);
  if ((existing[0]?.count ?? 0) >= 50) {
    console.log("  ✓ Templates already seeded");
  } else {
    const templates = makeTemplates();
    const chunks = [];
    for (let i = 0; i < templates.length; i += 50) chunks.push(templates.slice(i, i + 50));
    for (const chunk of chunks) {
      await db.insert(phishingTemplatesTable).values(chunk).onConflictDoNothing();
    }
    console.log(`  ✓ Seeded ${templates.length} phishing templates`);
  }

  console.log("📧 Seeding phishing campaigns...");
  const campaignCount = await db.select({ count: count() }).from(phishingCampaignsTable);
  if ((campaignCount[0]?.count ?? 0) >= 200) {
    console.log("  ✓ Campaigns already seeded");
  } else {
    const templates = await db.select({ id: phishingTemplatesTable.id }).from(phishingTemplatesTable).limit(20);
    const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    const adminId = admins[0]?.id ?? null;

    // Generate 200 historical campaigns with realistic distribution
    // 60 completed, 30 active, 100 draft, 10 paused
    const CAMPAIGN_NAMES = [
      "Q1 Email Phishing Test","Q2 Security Awareness Drill","Finance BEC Simulation",
      "SMS Phishing Awareness","QR Code Attack Drill","IT Helpdesk Impersonation",
      "CEO Fraud Awareness","HR Invoice Phishing","Password Reset Campaign",
      "VPN Credential Harvest","Deepfake Audio Test","WhatsApp Account Takeover",
      "DEWA Bill Phishing","RTA Fine Payment Scam","UAE PASS Identity Theft",
      "LinkedIn Job Offer Scam","Microsoft 365 Renewal","Annual Bonus Phishing",
      "Remote Worker Phishing","Cloud Credential Harvest",
    ];
    const STATUSES_200 = [
      ...Array(60).fill("completed"), ...Array(30).fill("active"),
      ...Array(100).fill("draft"),    ...Array(10).fill("paused"),
    ];
    const campaigns = STATUSES_200.map((status, i) => {
      const name = `${CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length]} ${Math.floor(i / CAMPAIGN_NAMES.length) + 1}`;
      const daysAgo = Math.floor(Math.random() * 180) + 1;
      const scheduledAt = status !== "draft"
        ? new Date(Date.now() - daysAgo * 86400000)
        : null;
      const completedAt = status === "completed"
        ? new Date(Date.now() - (daysAgo - 3) * 86400000)
        : null;
      const totalTargeted = status !== "draft"
        ? Math.floor(Math.random() * 50) + 5
        : 0;
      return {
        name,
        status,
        difficulty: (i % 5) + 1,
        totalTargeted,
        templateId: templates[(i % templates.length)]?.id ?? null,
        createdBy: adminId,
        scheduledAt,
        completedAt,
        targetAudience: { type: i % 3 === 0 ? "department" : "all" },
      };
    });

    const insertedCampaigns = await db.insert(phishingCampaignsTable).values(campaigns).returning({ id: phishingCampaignsTable.id, totalTargeted: phishingCampaignsTable.totalTargeted });
    console.log(`  ✓ Seeded ${insertedCampaigns.length} campaigns`);

    const employees = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "employee")).limit(53);

    for (const camp of insertedCampaigns.slice(0, 3)) {
      if (!camp.totalTargeted || camp.totalTargeted === 0) continue;
      const targeted = employees.slice(0, camp.totalTargeted);
      if (targeted.length === 0) continue;
      const results = targeted.map((e, i) => {
        const sent = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const opened = Math.random() > 0.3 ? new Date(sent.getTime() + Math.random() * 3600000) : null;
        const clicked = opened && Math.random() > 0.5 ? new Date(opened.getTime() + Math.random() * 600000) : null;
        const submitted = clicked && Math.random() > 0.6 ? new Date(clicked.getTime() + Math.random() * 300000) : null;
        const reported = !clicked && Math.random() > 0.7 ? new Date(sent.getTime() + Math.random() * 3600000) : null;
        return { campaignId: camp.id, userId: e.id, sentAt: sent, openedAt: opened, clickedAt: clicked, credentialSubmittedAt: submitted, reportedAt: reported };
      });
      await db.insert(phishingResultsTable).values(results).onConflictDoNothing();
    }
    console.log("  ✓ Seeded phishing results for completed campaigns");
  }

  console.log("🏢 Seeding tenants...");
  const tenantCount = await db.select({ count: count() }).from(tenantsTable);
  if ((tenantCount[0]?.count ?? 0) >= 3) {
    console.log("  ✓ Tenants already seeded");
  } else {
    await db.insert(tenantsTable).values([
      { name: "CyberCultX (Default)", domain: "cybercultx.com", plan: "enterprise", status: "active", employeeCount: 53, adminEmail: "admin@cybercultx.com", industry: "Technology", country: "UAE" },
      { name: "Emirates Finance Group", domain: "emiratesfinance.ae", plan: "professional", status: "active", employeeCount: 280, adminEmail: "ciso@emiratesfinance.ae", industry: "Finance", country: "UAE" },
      { name: "Gulf Health Authority", domain: "gulfhealth.gov.ae", plan: "enterprise", status: "active", employeeCount: 1200, adminEmail: "security@gulfhealth.gov.ae", industry: "Healthcare", country: "UAE" },
      { name: "Riyadh Tech Solutions", domain: "riyadhtech.sa", plan: "starter", status: "trial", employeeCount: 45, adminEmail: "admin@riyadhtech.sa", industry: "Technology", country: "KSA" },
      { name: "Kuwait Petroleum Corp", domain: "kpc.kw", plan: "professional", status: "active", employeeCount: 650, adminEmail: "itsec@kpc.kw", industry: "Energy", country: "Kuwait" },
      { name: "Doha Retail Holdings", domain: "doharetail.qa", plan: "starter", status: "trial", employeeCount: 120, adminEmail: "info@doharetail.qa", industry: "Retail", country: "Qatar" },
      { name: "Muscat Telecom SAOG", domain: "muscattel.om", plan: "professional", status: "suspended", employeeCount: 340, adminEmail: "admin@muscattel.om", industry: "Telecom", country: "Oman" },
    ]).onConflictDoNothing();
    console.log("  ✓ Seeded 7 tenants");
  }

  console.log("⚙️  Seeding system config...");
  const configCount = await db.select({ count: count() }).from(systemConfigTable);
  if ((configCount[0]?.count ?? 0) >= 5) {
    console.log("  ✓ System config already seeded");
  } else {
    await db.insert(systemConfigTable).values([
      { key: "platform.name", value: "CyberCultX", description: "Platform display name", category: "branding" },
      { key: "platform.support_email", value: "support@cybercultx.com", description: "Support contact email", category: "general" },
      { key: "ai.model", value: "gpt-4o", description: "AI model for phishing generation", category: "ai" },
      { key: "ai.temperature", value: "0.7", description: "AI generation temperature (0-1)", category: "ai" },
      { key: "security.max_login_attempts", value: "5", description: "Max failed login attempts before lockout", category: "security" },
      { key: "security.lockout_duration_min", value: "15", description: "Account lockout duration in minutes", category: "security" },
      { key: "security.session_timeout_min", value: "480", description: "Session timeout in minutes", category: "security" },
      { key: "notifications.email_enabled", value: "true", description: "Enable email notifications", category: "notifications" },
      { key: "notifications.sms_enabled", value: "false", description: "Enable SMS notifications", category: "notifications" },
      { key: "notifications.phishing_results_delay_days", value: "7", description: "Days to wait before notifying employees of phishing results", category: "notifications" },
      { key: "platform.default_language", value: "en", description: "Default platform language", category: "general" },
      { key: "platform.enable_rtl", value: "false", description: "Enable RTL Arabic layout", category: "general" },
      { key: "licensing.max_users", value: "1000", description: "Maximum users per tenant", category: "general" },
      { key: "licensing.max_campaigns", value: "unlimited", description: "Maximum phishing campaigns", category: "general" },
    ]).onConflictDoNothing();
    console.log("  ✓ Seeded 14 system config entries");
  }
}

seedPhishing()
  .then(() => { console.log("✅ Phishing seed complete!"); process.exit(0); })
  .catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
