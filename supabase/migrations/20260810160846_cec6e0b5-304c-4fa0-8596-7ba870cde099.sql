UPDATE public.monsters
SET token_image_url = image_url
WHERE is_public = false
  AND token_image_url IS NULL
  AND image_url IS NOT NULL;