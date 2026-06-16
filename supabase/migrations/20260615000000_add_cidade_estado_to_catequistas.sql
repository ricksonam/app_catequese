-- Migration to add missing columns 'cidade' and 'estado' to 'catequistas' table
ALTER TABLE public.catequistas ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT '';
ALTER TABLE public.catequistas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT '';
