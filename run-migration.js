const fs = require('fs');
const path = require('path');

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('❌ Usage: node run-migration.js <migration-file-path>');
    process.exit(1);
}

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
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const migrationPath = path.join(__dirname, migrationFile);
if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration:', path.basename(migrationPath));

const applyMigration = async () => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log('⚙️ Executing migration SQL...');

        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            console.error('❌ Error executing SQL:', error);
            process.exit(1);
        }

        console.log('✨ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    }
};

applyMigration();
