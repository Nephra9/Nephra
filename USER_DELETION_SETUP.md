# User Deletion Setup

To enable complete user deletion (from both database and authentication), you need to run the SQL function in your Supabase dashboard.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `scripts/delete-user-function.sql`
5. Click **Run**

## What this does:

The `delete_user_completely()` function:
- Deletes the user from `public.users` table
- Deletes the user from `auth.users` table (authentication)
- Runs with elevated privileges (SECURITY DEFINER) to bypass RLS
- Returns success/error status

## Security:

- The function is granted to `authenticated` users only
- Your application should have RLS policies ensuring only admins can call this
- The function uses `SECURITY DEFINER` to access the protected `auth` schema

## Usage:

The admin panel will automatically call this function when deleting a user. No additional code changes needed.

## Alternative (if function fails):

If you prefer not to use database functions, you can:
1. Set up a backend API with service role key
2. Call that API endpoint from the frontend
3. The backend deletes from both tables using the service role

For now, the fallback will delete from `users` table only if the function isn't available.
