-- Insert the first version of the app
-- (This tells the Update Checker what the latest version is)

insert into public.app_versions (version, download_url, release_notes, force_update)
values (
  '1.0.0', -- This MUST match the version in android/app/build.gradle (default is 1.0)
  'https://xmufhhfsaqtidszsrgfm.supabase.co/storage/v1/object/public/apk-releases/app-debug.apk',
  'Initial release of ClubSphere for Android! 🚀\n- Club Management\n- Event Planning\n- QR Check-ins',
  false
);
