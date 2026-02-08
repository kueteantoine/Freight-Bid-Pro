DO $$
DECLARE
    col_name TEXT;
BEGIN
    RAISE NOTICE 'Columns in public.disputes:';
    FOR col_name IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'disputes') LOOP
        RAISE NOTICE ' - %', col_name;
    END LOOP;
END $$;
