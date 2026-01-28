const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twzufrpmaynyqwgfkalc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3enVmcnBtYXlueXF3Z2ZrYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTI1NjcsImV4cCI6MjA4NDY2ODU2N30.O4ZVMyYCmIXDxB85HBH-nQ-P4PBhA947gD4TJQxGjlM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting user_roles table... (via RPC if available or common queries)');

    // We can't directly query pg_catalog via standard Supabase client easily without RPC
    // But we can check if we can insert a dummy role with a fake UUID to see the error message detail
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase
        .from('user_roles')
        .insert({
            user_id: fakeId,
            role_type: 'shipper'
        });

    if (error) {
        console.log('Caught expected error for fake ID:');
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
        console.log('Code:', error.code);
    } else {
        console.log('Wait, it allowed inserting a dummy ID? This might mean FK is NOT enforced or corrupted.');
    }
}

inspectTable();
