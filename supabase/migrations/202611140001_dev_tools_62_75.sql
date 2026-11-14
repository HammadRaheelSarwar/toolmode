-- Register the 14 new developer tools (#62 to #75) with the platform's free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('json-formatter', 'free'),
  ('json-minifier', 'free'),
  ('javascript-minifier', 'free'),
  ('css-minifier', 'free'),
  ('html-minifier', 'free'),
  ('sql-formatter', 'free'),
  ('regex-tester', 'free'),
  ('cron-expression-generator', 'free'),
  ('unix-timestamp-converter', 'free'),
  ('html-preview', 'free'),
  ('yaml-to-json', 'free'),
  ('json-to-yaml', 'free'),
  ('sql-formatter-validator', 'free'),
  ('code-diff-checker', 'free')
on conflict (tool_slug) do nothing;

