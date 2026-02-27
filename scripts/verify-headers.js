const https = require('https');

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

console.log(`Verifying security headers for: ${siteUrl}`);

const checkHeaders = (url) => {
    const protocol = url.startsWith('https') ? https : require('http');
    protocol.get(url, (res) => {
        const headers = res.headers;
        const requiredHeaders = [
            'content-security-policy',
            'x-frame-options',
            'x-content-type-options',
            'referrer-policy',
            'permissions-policy',
            'strict-transport-security'
        ];

        console.log('\n--- Header Audit ---');
        requiredHeaders.forEach(header => {
            if (headers[header]) {
                console.log(`✅ ${header}: ${headers[header].substring(0, 50)}${headers[header].length > 50 ? '...' : ''}`);
            } else {
                console.log(`❌ ${header}: MISSING`);
            }
        });
        console.log('--------------------\n');

    }).on('error', (e) => {
        console.error(`Error: ${e.message}`);
    });
};

checkHeaders(siteUrl);
