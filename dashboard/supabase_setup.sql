-- Run this entire script in the Supabase SQL Editor

-- 1. Create the custom role enum type
CREATE TYPE user_role AS ENUM ('admin', 'developer');

-- 2. Create the users table (Extending Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We want to automatically create a user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'developer'); -- Default to developer
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create the apps table
CREATE TABLE public.apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  config_filename TEXT NOT NULL UNIQUE, -- E.g., 'connect_3d.json'
  platform TEXT NOT NULL, -- E.g., 'Android', 'iOS'
  app_url TEXT, -- Play Store or App Store link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the app_controls table (The specific ad units/toggles)
CREATE TABLE public.app_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Banner Ad', 'Interstitial Ad'
  key_name TEXT NOT NULL, -- The specific JSON key to edit for this control 
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create the app_permissions table (Junction table)
CREATE TABLE public.app_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, app_id) -- A user can only be assigned to an app once
);

-- ===========================================
-- 5. Row Level Security (RLS) Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid infinite recursion when examining rules
-- This avoids querying the users table inside the users table policy
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Policies for 'users' table
-- Admins can read all users.
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  public.get_user_role() = 'admin'
);

-- Users can view their own profile.
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (
  auth.uid() = id
);

-- Admins can update roles
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (
  public.get_user_role() = 'admin'
);

-- Policies for 'apps' table
-- Admins can view/manage all apps
CREATE POLICY "Admins can manage apps" ON public.apps FOR ALL USING (
  public.get_user_role() = 'admin'
);

-- Developers can only READ apps they have permission for
CREATE POLICY "Developers can view assigned apps" ON public.apps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_permissions
    WHERE app_permissions.app_id = apps.id AND app_permissions.user_id = auth.uid()
  )
);

-- Policies for 'app_permissions' table
-- Admins can view/manage all permissions
CREATE POLICY "Admins can manage permissions" ON public.app_permissions FOR ALL USING (
  public.get_user_role() = 'admin'
);

-- Developers can view their own permissions
CREATE POLICY "Developers can view own permissions" ON public.app_permissions FOR SELECT USING (
  user_id = auth.uid()
);
