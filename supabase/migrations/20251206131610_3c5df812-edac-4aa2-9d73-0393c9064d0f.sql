-- Add image_url column to monsters table for token images
ALTER TABLE public.monsters ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;