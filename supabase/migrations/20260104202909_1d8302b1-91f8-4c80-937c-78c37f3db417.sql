-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to auto-approve and make admin if username is 'diFFFerent'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_val text;
BEGIN
  username_val := NEW.raw_user_meta_data ->> 'username';
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, approved)
  VALUES (
    NEW.id, 
    username_val,
    CASE WHEN lower(username_val) = 'different' THEN true ELSE false END
  );
  
  -- If it's the admin account, also add admin role
  IF lower(username_val) = 'different' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();