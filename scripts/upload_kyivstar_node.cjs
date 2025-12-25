#!/usr/bin/env node
/**
 * Upload Kyivstar hexagons to Supabase using Node.js
 * Usage: node scripts/upload_kyivstar_node.js data/kyivstar_hexagons.json
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

async function uploadHexagons(jsonFile) {
  // Read JSON file
  console.log(`Reading ${jsonFile}...`);
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const hexagons = data.hexagons || [];
  const sourceFile = data.source || path.basename(jsonFile);

  console.log(`Found ${hexagons.length} hexagons from ${sourceFile}`);

  // Prepare records
  const records = hexagons.map(hex => ({
    hex_id: hex.hex_id || '',
    coordinates: hex.coordinates || [],
    layer_name: 'active_clients',
    source_file: sourceFile,
    fill_color: hex.fill_color || '#22c55e',
    home_only: hex.stats?.home_only || 0,
    work_only: hex.stats?.work_only || 0,
    home_and_work: hex.stats?.home_and_work || 0,
    total_people: hex.stats?.total || 0,
    gyms: hex.gyms || []
  }));

  // Delete existing records
  console.log('\nClearing existing hexagons...');
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/kyivstar_hexagons?layer_name=eq.active_clients`,
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
    console.error('Delete failed:', await deleteRes.text());
  }

  // Insert in batches
  const batchSize = 50;
  let totalInserted = 0;

  console.log('\nUploading hexagons...');

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/kyivstar_hexagons`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(batch)
      }
    );

    if (!insertRes.ok) {
      console.error(`Batch ${i}-${i+batch.length} failed:`, await insertRes.text());
      process.exit(1);
    }

    totalInserted += batch.length;
    console.log(`  Uploaded ${totalInserted}/${records.length} hexagons...`);
  }

  console.log(`\nDone! Uploaded ${totalInserted} hexagons to Supabase.`);
}

// Main
const jsonFile = process.argv[2];
if (!jsonFile) {
  console.log('Usage: node scripts/upload_kyivstar_node.js <json_file>');
  console.log('\nExample:');
  console.log('  node scripts/upload_kyivstar_node.js data/kyivstar_hexagons.json');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`Error: File not found: ${jsonFile}`);
  process.exit(1);
}

uploadHexagons(jsonFile).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
