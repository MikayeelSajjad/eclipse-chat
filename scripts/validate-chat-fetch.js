const http = require('http');
const opts = {
  hostname: 'localhost',
  port: 3002,
  path: '/chat',
  method: 'GET',
};
const req = http.request(opts, (res) => {
  console.log('STATUS', res.statusCode);
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('HEADERS', res.headers);
    console.log('BODY LENGTH', data.length);
  });
});
req.on('error', (e) => {
  console.error('ERROR', e.message);
});
req.end();
