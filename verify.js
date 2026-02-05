
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyAll() {
    const user_id = 'c0a80101-0000-0000-0000-000000000000'; // Placeholder

    async function test(name, query) {
        process.stdout.write(`Testing ${name}... `);
        const { error } = await query;
        if (error) {
            console.log("FAILED");
            console.log(JSON.stringify(error, null, 2));
        } else {
            console.log("PASSED");
        }
    }

    // 1. getDriverJobs(history) - should pass now without 'expired'
    await test('getDriverJobs(history)',
        supabase.from('shipment_assignments').select('id').in('assignment_status', ['rejected', 'cancelled', 'completed'])
    );

    // 2. getDriverTransporters - test the new two-step queries
    console.log("Testing getDriverTransporters steps...");
    const { data: assignments, error: err1 } = await supabase.from('driver_assignments').select('transporter_user_id').eq('driver_user_id', user_id);
    console.log("  Step 1 (assignments):", err1 ? "FAILED: " + err1.message : "PASSED");

    const { error: err2 } = await supabase.from('user_roles').select('user_id').in('role_type', ['transporter', 'carrier']).limit(1);
    console.log("  Step 2 (roles):", err2 ? "FAILED: " + err2.message : "PASSED");

    // 3. getMileageLogs - final check
    await test('getMileageLogs',
        supabase.from('driver_mileage_logs').select('*').limit(1)
    );
}

verifyAll();
