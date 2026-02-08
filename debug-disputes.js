const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkColumns() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("Checking columns of 'disputes' via exec_sql...");

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'disputes' AND table_schema = 'public'"
    });

    if (error) {
        console.error("RPC Error:", error.message);

        const check = async (col) => {
            const { error: colError } = await supabase.from('disputes').select(col).limit(1);
            console.log(`${col} exists:`, !colError);
            if (colError) console.log(`${col} Error:`, colError.message);
        };

        await check('dispute_number');
        await check('status');
        await check('dispute_status');
        await check('dispute_description');
        await check('priority');
        await check('dispute_priority');
    } else {
        console.log("Columns in 'disputes':");
        data.forEach(col => console.log(` - ${col.column_name} (${col.data_type})`));
    }
}

checkColumns();
