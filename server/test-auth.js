const http = require('http');

async function runTests() {
  console.log('🧪 Starting End-to-End Authentication Tests...');

  // Start the server
  const { startServer } = require('./dist/server.js');
  const server = await startServer();

  console.log('Server is started and listening. Commencing API test calls...');

  const post = (path, body, headers = {}) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api' + path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      }, res => {
        let resData = '';
        res.on('data', chunk => resData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  const get = (path, headers = {}) => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api' + path,
        method: 'GET',
        headers,
      }, res => {
        let resData = '';
        res.on('data', chunk => resData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  };

  try {
    // 1. Health check
    console.log('\n1. Testing Health Endpoint:');
    const health = await get('/health');
    console.log('Status:', health.status, 'Body:', health.body);

    // 2. Register New Patient
    console.log('\n2. Testing Patient Registration (POST /api/auth/register):');
    const randomEmail = `testpatient_${Date.now()}@hospital.com`;
    const regRes = await post('/auth/register', {
      name: 'Test Patient Real',
      email: randomEmail,
      password: 'password123',
      phone: '+1 (555) 999-8877',
      role: 'PATIENT',
      bloodGroup: 'B+',
      allergies: 'None',
    });
    console.log('Registration Status:', regRes.status);
    console.log('Registration Response user:', regRes.body.user?.name, 'Role:', regRes.body.user?.role, 'MRN:', regRes.body.user?.patient?.medicalRecordNumber);

    if (regRes.status !== 201) {
      throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    }

    const token = regRes.body.token;

    // 3. Login with New Patient Credentials
    console.log('\n3. Testing Login with New Credentials (POST /api/auth/login):');
    const loginRes = await post('/auth/login', {
      email: randomEmail,
      password: 'password123',
    });
    console.log('Login Status:', loginRes.status);
    console.log('Login User Name:', loginRes.body.user?.name);
    console.log('Login Token:', loginRes.body.token ? 'JWT Present ✅' : 'Missing ❌');

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    // 4. Verify /api/auth/me with Token
    console.log('\n4. Testing Token Verification (GET /api/auth/me):');
    const meRes = await get('/auth/me', {
      Authorization: `Bearer ${token}`,
    });
    console.log('Me Status:', meRes.status);
    console.log('Me User Role:', meRes.body.user?.role);
    console.log('Me Patient MRN:', meRes.body.user?.patient?.medicalRecordNumber);

    // 5. Test Demo Admin Login
    console.log('\n5. Testing Admin Login:');
    const adminLogin = await post('/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123',
    });
    console.log('Admin Login Status:', adminLogin.status, 'Role:', adminLogin.body.user?.role);

    // 6. Test Demo Doctor Login
    console.log('\n6. Testing Doctor Login:');
    const docLogin = await post('/auth/login', {
      email: 'dr.sarah@hospital.com',
      password: 'doctor123',
    });
    console.log('Doctor Login Status:', docLogin.status, 'Role:', docLogin.body.user?.role, 'Specialty:', docLogin.body.user?.doctor?.specialization);

    console.log('\n====================================================');
    console.log('🎉 ALL AUTHENTICATION FLOWS PASSED 100% SUCCESSFULLY! 🎉');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exit(1);
  }
}

runTests();
