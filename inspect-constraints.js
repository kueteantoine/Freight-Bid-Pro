const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://twzufrpmaynyqwgfkalc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3enVmcnBtYXlueXF3Z2ZrYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTI1NjcsImV4cCI6MjA4NDY2ODU2N30.O4ZVMyYCmIXDxB85HBH-nQ-P4PBhA947gD4TJQxGjlM';

const supabase = createClient(supabaseUrl, supabaseKey);

let output = '';
function log(msg) {
    console.log(msg);
    output += msg + '\n';
}

async function testRole(role) {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase
        .from('user_roles')
        .insert({
            user_id: fakeId,
            role_type: role
        });

    if (error) {
        log(`Test Role [${role}]: FAILED (${error.message})`);
    } else {
        log(`Test Role [${role}]: SUCCESS`);
    }
}

async function runTests() {
    log('--- Investigating Role Type Enum ---');
    await testRole('shipper');
    await testRole('transporter');
    await testRole('carrier');
    log('-----------------------------------');

    fs.writeFileSync('output.txt', output);
}

runTests();
