-- Fix the incorrect user_id in call_metrics table
-- The user_id has an extra '1' at the beginning that needs to be removed

-- First, let's see the current incorrect row
SELECT id, user_id, total_apeluri, apeluri_initiate, apeluri_primite 
FROM public.call_metrics 
WHERE user_id::text LIKE '1e69c35d9%';

-- Update the user_id to remove the leading '1'
UPDATE public.call_metrics
SET user_id = 'e69c35d9-f5e8-45de-8b71-fbde02efbb45'
WHERE user_id = '1e69c35d9-f5e8-45de-8b71-fbde02efbb45';

-- Verify the fix
SELECT id, user_id, total_apeluri, apeluri_initiate, apeluri_primite 
FROM public.call_metrics 
WHERE user_id = 'e69c35d9-f5e8-45de-8b71-fbde02efbb45';
