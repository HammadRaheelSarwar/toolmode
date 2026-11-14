-- Register the six new image tools with the platform's existing free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('background-remover', 'free'),
  ('background-blur', 'free'),
  ('image-upscaler', 'free'),
  ('image-rotator-flipper', 'free'),
  ('image-watermark', 'free'),
  ('image-enhancer', 'free')
on conflict (tool_slug) do nothing;

