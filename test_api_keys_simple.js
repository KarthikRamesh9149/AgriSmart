/**
 * Simple Node.js script to test each Mistral API key
 * Run: node test_api_keys_simple.js
 */

const https = require('https');

const keys = {
  MISTRAL_FEATURE1_KEY: 'rv1SDEmFg0NCdvAI52TCHdaOi9nDekMJ',
  MISTRAL_FEATURE2_KEY: '4kBG2AwgIrNPwhkJJfiQ7NUtvnCyEGCC',
  MISTRAL_FEATURE3_KEY: 'QTPfGYSSCoixjfJKiXsY4haapUv9i689',
  MISTRAL_FEATURE4_KEY: 'ZpESZuDavVuc0lg6ziDjG8msjdkiMZ3w',
  MISTRAL_BRIEF_KEY: 'QTPfGYSSCoixjfJKiXsY4haapUv9i689',
};

async function testKey(keyName, keyValue) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    });

    const options = {
      hostname: 'api.mistral.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        Authorization: `Bearer ${keyValue}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const statusCode = res.statusCode;
        const status = statusCode === 200 ? '✅ PASS' : `❌ FAIL (${statusCode})`;
        console.log(`${keyName.padEnd(25)} ${status}`);

        if (statusCode !== 200) {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`  → Error: ${json.error.message}`);
            }
          } catch (e) {
            console.log(`  → Response: ${data.substring(0, 100)}`);
          }
        }

        resolve(statusCode === 200);
      });
    });

    req.on('error', (e) => {
      console.log(`${keyName.padEnd(25)} ❌ FAIL (Network Error)`);
      console.log(`  → ${e.message}`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================================');
  console.log('Testing Mistral API Keys');
  console.log('================================================================================\n');

  const results = {};

  for (const [keyName, keyValue] of Object.entries(keys)) {
    results[keyName] = await testKey(keyName, keyValue);
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\n================================================================================');
  console.log('Summary');
  console.log('================================================================================\n');

  const passed = Object.values(results).filter((v) => v).length;
  const total = Object.keys(results).length;

  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('✅ All API keys are VALID and working!\n');
  } else {
    console.log('❌ Some API keys are not working. Check the errors above.\n');
    console.log('Failed keys:');
    Object.entries(results).forEach(([key, result]) => {
      if (!result) {
        console.log(`  - ${key}`);
      }
    });
    console.log();
  }
}

runTests().catch(console.error);
