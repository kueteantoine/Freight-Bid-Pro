
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMileage() {
    console.log("Checking driver_mileage_logs columns...");
    // Try to get one row
    const { data, error } = await supabase.from('driver_mileage_logs').select('*').limit(1);
    if (error) {
        console.log("Error:", error.message);
        console.log("Details:", error.details);
    } else {
        console.log("Success! Columns:", Object.keys(data[0] || {}));
    }
}

checkMileage();
