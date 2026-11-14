-- Register the nine new utility tools (#38 to #46) with the platform's existing free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('qr-code-generator', 'free'),
  ('barcode-generator', 'free'),
  ('currency-converter', 'free'),
  ('weather-forecast', 'free'),
  ('world-clock-converter', 'free'),
  ('public-holiday-finder', 'free'),
  ('ip-address-lookup', 'free'),
  ('country-information-finder', 'free'),
  ('sunrise-sunset-calculator', 'free')
on conflict (tool_slug) do nothing;

