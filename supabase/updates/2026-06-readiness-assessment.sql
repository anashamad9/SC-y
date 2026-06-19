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
      'CyberCultX Security Readiness Assessment',
      'Eight psychometric scenarios used to personalize security training recommendations.',
      8
    )
    returning id into readiness_id;
  end if;

  update assessments
  set
    title = 'CyberCultX Security Readiness Assessment',
    description = 'Eight psychometric scenarios used to personalize security training recommendations.',
    estimated_minutes = 8
  where id = readiness_id;

  delete from assessment_questions where assessment_id = readiness_id;

  insert into assessment_questions (assessment_id, text, category, options, weight, display_order)
  values
  (readiness_id, 'You receive an urgent email from your manager asking you to review an attached document immediately.', 'phishing_recognition', '[{"value":1,"label":"Open the attachment immediately."},{"value":3,"label":"Reply asking if it is legitimate before opening."},{"value":4,"label":"Verify the sender, inspect the email carefully, and confirm through another communication channel."},{"value":2,"label":"Forward it to a colleague and ask what they think."}]'::jsonb, 1, 1),
  (readiness_id, 'You are asked to create a password for a new business application.', 'password_hygiene', '[{"value":1,"label":"Use the same password you use elsewhere."},{"value":2,"label":"Add numbers to your existing password."},{"value":3,"label":"Create a unique password with a memorable pattern."},{"value":4,"label":"Use a password manager to generate and store a strong unique password."}]'::jsonb, 1, 2),
  (readiness_id, 'You receive a QR code from an unknown source claiming you have won a reward.', 'qr_safety', '[{"value":1,"label":"Scan it immediately."},{"value":2,"label":"Ignore it without reporting it."},{"value":3,"label":"Verify the source before scanning."},{"value":4,"label":"Report it as suspicious and avoid interacting with it."}]'::jsonb, 1, 3),
  (readiness_id, 'While working remotely, you need internet access and only a public Wi-Fi network is available.', 'remote_work', '[{"value":1,"label":"Connect directly and continue working."},{"value":2,"label":"Avoid sensitive activities but continue browsing."},{"value":3,"label":"Use a VPN before connecting to company resources."},{"value":4,"label":"Use a trusted hotspot or VPN and follow company remote access policy."}]'::jsonb, 1, 4),
  (readiness_id, 'You notice a colleague sharing sensitive company information in a public chat.', 'data_handling', '[{"value":1,"label":"Ignore it."},{"value":2,"label":"Mention it privately later."},{"value":3,"label":"Inform your manager immediately."},{"value":4,"label":"Follow company reporting procedures and ensure the risk is addressed."}]'::jsonb, 1, 5),
  (readiness_id, 'You receive a login page that looks exactly like your company''s portal.', 'credential_safety', '[{"value":1,"label":"Enter credentials immediately."},{"value":2,"label":"Check only the company logo."},{"value":3,"label":"Verify the URL and security indicators first."},{"value":4,"label":"Verify the URL, certificate, domain legitimacy, and access through official channels."}]'::jsonb, 1, 6),
  (readiness_id, 'A coworker asks to borrow your account credentials to complete an urgent task.', 'access_control', '[{"value":1,"label":"Share them temporarily."},{"value":2,"label":"Share only if they are a trusted colleague."},{"value":3,"label":"Refuse and suggest requesting proper access."},{"value":4,"label":"Refuse, explain policy requirements, and direct them to the approved access process."}]'::jsonb, 1, 7),
  (readiness_id, 'You notice unusual activity on your corporate account.', 'incident_response', '[{"value":1,"label":"Ignore it and monitor later."},{"value":2,"label":"Change your password only."},{"value":3,"label":"Change your password and notify IT."},{"value":4,"label":"Immediately report the incident, secure the account, and follow the organization''s incident response process."}]'::jsonb, 1, 8);
end $$;
