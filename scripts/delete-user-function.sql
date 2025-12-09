-- Function to completely delete a user from both users table and auth.users
-- This function runs with SECURITY DEFINER to bypass RLS and access auth schema

CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Delete from public.users table first (to maintain referential integrity)
  DELETE FROM public.users WHERE id = user_id;
  
  -- Delete from auth.users table (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'User deleted from all systems',
    'user_id', user_id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (admin role check should be in RLS)
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_completely IS 'Deletes a user from both users table and auth.users table. Should only be called by admins.';
