const http = require('http');

console.log('=== COMPLETE SYSTEM TEST ===\n');

// Test 1: Check Backend Server
console.log('1. Testing Backend Server...');
const options1 = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req1 = http.request(options1, (res) => {
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   Backend Server: RUNNING');
      console.log('   Response:', data);
    } else {
      console.log('   Backend Server: FAILED');
    }
    
    // Test 2: Test Webhook with Products
    testWebhook();
  });
});

req1.on('error', (e) => {
  console.log('   Backend Server: FAILED -', e.message);
  console.log('   Please start backend: cd backend && node server.js');
});

req1.end();

function testWebhook() {
  console.log('\n2. Testing WhatsApp Webhook...');
  const testData = 'Body=products&From=whatsapp:+1234567890';
  
  const options2 = {
    hostname: 'localhost',
    port: 5000,
    path: '/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': testData.length
    }
  };

  const req2 = http.request(options2, (res) => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200 && data.includes('TwiML')) {
        console.log('   Webhook: WORKING');
        console.log('   Response contains TwiML format');
        console.log('   Sample response:', data.substring(0, 100) + '...');
      } else {
        console.log('   Webhook: FAILED');
        console.log('   Status:', res.statusCode);
        console.log('   Response:', data);
      }
      
      // Test 3: Check Products API
      testProductsAPI();
    });
  });

  req2.on('error', (e) => {
    console.log('   Webhook: FAILED -', e.message);
  });

  req2.write(testData);
  req2.end();
}

function testProductsAPI() {
  console.log('\n3. Testing Products API...');
  const options3 = {
    hostname: 'localhost',
    port: 5000,
    path: '/products',
    method: 'GET'
  };

  const req3 = http.request(options3, (res) => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const products = JSON.parse(data);
        if (products.success && products.data.length > 0) {
          console.log('   Products API: WORKING');
          console.log('   Found', products.data.length, 'products');
          products.data.forEach((p, i) => {
            console.log(`   ${i+1}. ${p.name} - ¥${p.price}`);
          });
        } else {
          console.log('   Products API: FAILED - No products found');
        }
      } catch (e) {
        console.log('   Products API: FAILED - Invalid JSON');
      }
      
      // Test 4: Check Analytics API
      testAnalyticsAPI();
    });
  });

  req3.on('error', (e) => {
    console.log('   Products API: FAILED -', e.message);
  });

  req3.end();
}

function testAnalyticsAPI() {
  console.log('\n4. Testing Analytics API...');
  const options4 = {
    hostname: 'localhost',
    port: 5000,
    path: '/analytics',
    method: 'GET'
  };

  const req4 = http.request(options4, (res) => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const analytics = JSON.parse(data);
        if (analytics.success) {
          console.log('   Analytics API: WORKING');
          console.log('   Total Users:', analytics.data.totalUsers);
          console.log('   Total Messages:', analytics.data.totalMessages);
          console.log('   Total Products:', analytics.data.totalProducts);
          console.log('   Conversion Rate:', analytics.data.conversionRate + '%');
        } else {
          console.log('   Analytics API: FAILED');
        }
      } catch (e) {
        console.log('   Analytics API: FAILED - Invalid JSON');
      }
      
      console.log('\n=== TEST COMPLETE ===');
      console.log('\nNEXT STEPS:');
      console.log('1. Start ngrok: ngrok http 5000');
      console.log('2. Copy the HTTPS URL from ngrok');
      console.log('3. Go to Twilio Console');
      console.log('4. Set webhook URL to: YOUR_NGROK_URL/webhook');
      console.log('5. Test WhatsApp messages');
    });
  });

  req4.on('error', (e) => {
    console.log('   Analytics API: FAILED -', e.message);
  });

  req4.end();
}
