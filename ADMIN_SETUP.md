# 🔧 Admin Setup Guide

## How to Get Admin Access

### **Step 1: Fix Storage Policies**
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `scripts/fix-storage-policies.sql`
3. Click **Run** to fix the avatar upload issue

### **Step 2: Create Admin User**

#### **Option A: Make Existing User Admin**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `scripts/create-admin-user.sql`
3. Replace `'your-email@example.com'` with your actual email
4. Click **Run**

#### **Option B: Make First User Admin**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:
```sql
UPDATE users 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);
```

### **Step 3: Access Admin Panel**
1. **Sign in** to your app with the admin account
2. Go to: `http://localhost:5173/admin/project-management`
3. You should now see the admin panel with:
   - **Applications Tab**: Review and approve/reject project applications
   - **Projects Tab**: View all projects

## 🎯 **How to Use the System**

### **For Regular Users:**
1. **Sign up/Login** → Go to Dashboard
2. **Register Project** → Click "Register Project" in dashboard
3. **Track Applications** → Click "My Applications" in dashboard
4. **Edit Profile** → Click "Edit Profile" in dashboard

### **For Admins:**
1. **Login** with admin account
2. **Go to Admin Panel** → `/admin/project-management`
3. **Review Applications** → Approve/Reject with feedback
4. **Manage Projects** → View all submitted projects

## 🔗 **Important URLs**

- **User Dashboard**: `/dashboard`
- **Project Registration**: `/projects/register`
- **My Applications**: `/dashboard/my-applications`
- **Profile**: `/dashboard/profile`
- **Admin Panel**: `/admin/project-management`

## 🚨 **Troubleshooting**

### **Storage Upload Error:**
- Run the `fix-storage-policies.sql` script
- Make sure the `avatars` bucket exists and is public

### **Admin Access Denied:**
- Check your user role in the database
- Make sure you're logged in with the correct account
- Verify the role is set to 'admin' in the users table

### **RLS Policy Errors:**
- Run the `fix-recursive-policies.sql` script first
- Then run the storage policies fix

## 📝 **Database Queries for Debugging**

```sql
-- Check all users and their roles
SELECT id, email, full_name, role, status, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check if avatars bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```
