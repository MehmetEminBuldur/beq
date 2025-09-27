-- Simple fix for status fields if tables use text instead of enums
-- Use this if the main migration script doesn't work

-- Check if bricks table exists and update status values
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bricks' AND table_schema = 'public') THEN
        -- Update any 'pending' status to 'not_started'
        UPDATE public.bricks SET status = 'not_started' WHERE status = 'pending';
        
        -- If the status column is text type, we can set a default
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bricks' AND column_name = 'status' 
                  AND data_type = 'text' AND table_schema = 'public') THEN
            ALTER TABLE public.bricks ALTER COLUMN status SET DEFAULT 'not_started';
        END IF;
    END IF;
END $$;

-- Check if quantas table exists and update status values  
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quantas' AND table_schema = 'public') THEN
        -- Update any 'pending' status to 'not_started'
        UPDATE public.quantas SET status = 'not_started' WHERE status = 'pending';
        
        -- If the status column is text type, we can set a default
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'quantas' AND column_name = 'status' 
                  AND data_type = 'text' AND table_schema = 'public') THEN
            ALTER TABLE public.quantas ALTER COLUMN status SET DEFAULT 'not_started';
        END IF;
    END IF;
END $$;

-- Show current table structures for verification
SELECT 'bricks table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bricks'
ORDER BY ordinal_position;

SELECT 'quantas table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'quantas'
ORDER BY ordinal_position;
