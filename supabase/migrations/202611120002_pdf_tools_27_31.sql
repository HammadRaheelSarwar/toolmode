-- Register the five new PDF tools with the platform's existing free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('pdf-watermark', 'free'),
  ('pdf-page-numbering', 'free'),
  ('protect-pdf', 'free'),
  ('unlock-pdf', 'free'),
  ('pdf-to-text', 'free')
on conflict (tool_slug) do nothing;
