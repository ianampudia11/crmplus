
import http from 'http';

const req = http.request('http://localhost:9000/api/debug-auth?email=bar@eto.com', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('StatusCode:', res.statusCode);
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.end();
