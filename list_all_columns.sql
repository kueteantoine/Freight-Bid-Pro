DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position
    ) LOOP
        RAISE NOTICE 'Table: %, Column: %, Type: %', r.table_name, r.column_name, r.data_type;
    END LOOP;
END $$;
