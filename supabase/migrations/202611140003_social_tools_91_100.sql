-- Register the 10 new Social Media & Marketing tools (#91 to #100) with the platform's free-plan policy.
insert into public.tool_settings (tool_slug, required_plan) values
  ('youtube-thumbnail-downloader', 'free'),
  ('youtube-banner-resizer', 'free'),
  ('instagram-bio-formatter', 'free'),
  ('hashtag-generator', 'free'),
  ('social-media-post-preview', 'free'),
  ('utm-campaign-builder', 'free'),
  ('email-signature-generator', 'free'),
  ('qr-business-card-generator', 'free'),
  ('youtube-description-formatter', 'free'),
  ('social-media-character-counter', 'free')
on conflict (tool_slug) do nothing;

