const http = require('http');

const data = JSON.stringify({
  fullName: "John",
  age: 40,
  gender: "Male",
  contactNumber: "9999",
  disease: "Flu",
  pastRecords: "None"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/patients',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
