#!/usr/bin/env node
/**
 * Upload Apollo clubs to Supabase
 * Usage: node scripts/upload_apollo_clubs.cjs
 */

const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

async function uploadClubs() {
  // Read JSON file
  const jsonFile = 'data/apollo_clubs.json';
  console.log(`Reading ${jsonFile}...`);

  if (!fs.existsSync(jsonFile)) {
    console.error(`Error: File not found: ${jsonFile}`);
    console.log('Run: python scripts/geocode_apollo_clubs.py first');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const clubs = data.clubs || [];

  console.log(`Found ${clubs.length} clubs`);

  // Delete existing records
  console.log('\nClearing existing clubs...');
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/apollo_clubs?id=neq.00000000-0000-0000-0000-000000000000`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!deleteRes.ok) {
    const text = await deleteRes.text();
    // Ignore if table doesn't exist yet
    if (!text.includes('does not exist')) {
      console.error('Delete failed:', text);
    }
  }

  // Insert clubs
  console.log('Uploading clubs...');

  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/apollo_clubs`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(clubs)
    }
  );

  if (!insertRes.ok) {
    console.error('Insert failed:', await insertRes.text());
    process.exit(1);
  }

  console.log(`\nDone! Uploaded ${clubs.length} Apollo clubs to Supabase.`);
}

uploadClubs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
