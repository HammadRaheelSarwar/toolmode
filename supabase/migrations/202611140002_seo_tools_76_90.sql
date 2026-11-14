-- Register the 15 new SEO & Website tools (#76 to #90) with the platform's free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('meta-tags-analyzer', 'free'),
  ('open-graph-preview', 'free'),
  ('twitter-card-preview', 'free'),
  ('schema-markup-generator', 'free'),
  ('schema-markup-validator', 'free'),
  ('canonical-url-checker', 'free'),
  ('hreflang-generator', 'free'),
  ('http-status-checker', 'free'),
  ('redirect-checker', 'free'),
  ('url-slug-generator', 'free'),
  ('keyword-research-organizer', 'free'),
  ('serp-snippet-preview', 'free'),
  ('utm-link-builder', 'free'),
  ('broken-link-checker', 'free'),
  ('website-word-counter', 'free')
on conflict (tool_slug) do nothing;

