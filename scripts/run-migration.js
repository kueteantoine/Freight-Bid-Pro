/**
 * Migration Runner Script
 * Applies SQL migrations to remote Supabase database
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Read the migration file
const migrationPath = process.argv[2] || path.join(__dirname, 'supabase', 'migrations', '20260201000000_tracking_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Applying migration:', path.basename(migrationPath));
console.log('🌐 Target database:', SUPABASE_URL);

// Parse URL to get the project reference
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

// Prepare the request to Supabase SQL endpoint
const requestData = JSON.stringify({
    query: migrationSQL
});

const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': requestData.length
    }
};

// Alternative approach: Use pg connection string if available
// For now, we'll use a simpler approach with fetch API
const applyMigration = async () => {
    try {
        const { createClient } = require('@supabase/supabase-js');

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false
            }
        });

        console.log('⚙️  Executing migration SQL...');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            // Skip comments
            if (statement.trim().startsWith('--')) continue;

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    // Check if it's a benign error (already exists)
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️  Skipped (already exists): Statement ${i + 1}`);
                    } else {
                        console.error(`❌ Error in statement ${i + 1}:`, error.message);
                        errorCount++;
                    }
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Exception in statement ${i + 1}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📝 Total statements: ${statements.length}`);

        if (errorCount === 0) {
            console.log('\n✨ Migration completed successfully!');
        } else {
            console.log('\n⚠️  Migration completed with some errors.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n💡 Please apply the migration manually via Supabase Dashboard:');
        console.error('   1. Go to your Supabase project dashboard');
        console.error('   2. Navigate to SQL Editor');
        console.error('   3. Copy and paste the contents of:', migrationPath);
        console.error('   4. Execute the SQL');
        process.exit(1);
    }
};

applyMigration();
