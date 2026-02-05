
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function listTables() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("Listing tables in public schema...");
    // We can't easily query pg_catalog with anon key.
    // Let's just try to query suspected tables.

    const tables = [
        'profiles',
        'user_roles',
        'shipments',
        'shipment_assignments',
        'driver_expenses',
        'driver_expense_claims',
        'driver_mileage_logs',
        'driver_assignments',
        'vehicles',
        'driver_status'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`Table '${table}': MISSING or ERROR (${error.message})`);
        } else {
            console.log(`Table '${table}': EXISTS`);
        }
    }
}

listTables();
