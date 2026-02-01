import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Read migration file
const migrationFile = process.argv[2] || '20260201000000_tracking_schema.sql';
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration:', migrationFile);
console.log('🌐 Target:', SUPABASE_URL);
console.log('');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Execute the migration
async function runMigration() {
    try {
        // Use the SQL query endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ query: migrationSQL })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Migration applied successfully!');
        console.log(result);
    } catch (error) {
        console.error('❌ Error applying migration:', error.message);
        console.error('\n💡 Manual application required:');
        console.error('   1. Go to https://supabase.com/dashboard/project/twzufrpmaynyqwgfkalc/sql');
        console.error('   2. Copy the contents of:', migrationPath);
        console.error('   3. Paste and execute in the SQL Editor');
        process.exit(1);
    }
}

runMigration();
