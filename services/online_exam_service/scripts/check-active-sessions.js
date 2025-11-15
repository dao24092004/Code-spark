#!/usr/bin/env node

/**
 * Quick smoke-test for the online exam service proctoring bridge.
 *
 * Usage:
 *   node scripts/check-active-sessions.js --url=http://localhost:3000 --token="Bearer ey..."
 *
 * Options:
 *   --url     Base URL of the online exam service (defaults to http://localhost:3000).
 *   --token   Authorization header value. If omitted, the script will look at
 *             the ADMIN_JWT or AUTH_TOKEN environment variables.
 */

const axios = require('axios');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (key && value) {
      const normalizedKey = key.replace(/^--/, '');
      result[normalizedKey] = value;
    }
  }

  return result;
};

const args = parseArgs();
const baseUrl = args.url || process.env.ONLINE_EXAM_BASE_URL || 'http://localhost:3000';
const token =
  args.token ||
  process.env.AUTH_TOKEN ||
  process.env.ADMIN_JWT ||
  null;

const endpoint = `${baseUrl.replace(/\/$/, '')}/api/proctoring/active-sessions`;

const run = async () => {
  try {
    const response = await axios.get(endpoint, {
      headers: token ? { Authorization: token } : undefined,
      timeout: 5000,
    });

    const { success, data } = response.data || {};

    console.log('✅ Request succeeded');
    console.log(`🔁 HTTP ${response.status}`);
    console.log(`📦 success=${success}`);
    console.log(`🧑‍💻 Active sessions count: ${Array.isArray(data) ? data.length : 'n/a'}`);

    if (Array.isArray(data) && data.length > 0) {
      console.log('📄 Sample session:', JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed with response:');
      console.error(`   HTTP ${error.response.status}`);
      console.error('   Body:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ Request was sent but no response received:', error.message);
    } else {
      console.error('❌ Failed to execute request:', error.message);
    }
    process.exitCode = 1;
  }
};

run();

