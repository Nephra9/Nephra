# Recent Changes Summary

## 1. Social Login Control (Login.jsx)
✅ **Hidden Google login when `allow_social_login` is disabled**
- Added `useSettings` hook to check `settings.allow_social_login`
- Google login button and divider only render if social login is enabled
- Changes apply live from admin settings

## 2. File Upload for Images (Settings.jsx + imageUploadService.js)
✅ **Replaced URL inputs with file upload in Appearance tab**
- Logo upload: Upload image directly to Supabase Storage
- Favicon upload: Upload image directly to Supabase Storage
- Both support: JPG, PNG, GIF, WebP, SVG
- Max file size: 5MB per image
- File preview shown with delete option
- Upload state indicators (loading spinner)

## 3. Image Upload Service (New)
✅ **Created `imageUploadService.js`**
- `uploadImage(file, folder)` - Uploads to Supabase Storage, returns public URL
- `deleteImage(imageUrl)` - Deletes image from storage
- Automatic file validation (type and size)
- Error handling with user-friendly messages
- Stores images in `/uploads/branding/` folders

## 4. Live Image Application
✅ **Images apply immediately when uploaded**
- Logo updates shown in preview
- Favicon updates browser tab icon
- SettingsContext applies changes in real-time
- Supabase Realtime subscription keeps all clients synced
- Images persist in database and localStorage

## 5. Storage Setup (setup-storage.sql)
✅ **SQL script to configure Supabase Storage**
- Creates `uploads` bucket (public)
- Sets up RLS policies for security
- Run in Supabase SQL Editor before using uploads

## What Works Now:
1. ✅ Admin disables social login → Google button hides
2. ✅ Admin uploads logo → Live update across app
3. ✅ Admin uploads favicon → Browser tab icon updates
4. ✅ Changes sync across all browser tabs
5. ✅ Uploads secure with RLS policies
6. ✅ File validation (type + size)

## To Enable:
1. Run `setup-storage.sql` in Supabase SQL Editor
2. Save settings from Admin Panel
3. Upload images via file chooser
4. Changes apply immediately!
