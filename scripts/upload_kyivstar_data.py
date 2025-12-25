#!/usr/bin/env python3
"""
Upload Kyivstar hexagons to Supabase.
Reads the extracted JSON file and inserts into kyivstar_hexagons table.

Usage:
    python3 upload_kyivstar_data.py <json_file>

Environment variables:
    SUPABASE_URL - Supabase project URL
    SUPABASE_KEY - Supabase service role key (not anon key)
"""

import os
import sys
import json
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed. Run:")
    print("  pip install supabase")
    sys.exit(1)


def get_supabase_client() -> Client:
    """Create Supabase client from environment variables."""
    # Try to load from .env file if it exists
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

    url = os.environ.get('VITE_SUPABASE_URL') or os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_KEY')

    if not url or not key:
        print("Error: Missing Supabase credentials.")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables,")
        print("or add them to .env file.")
        sys.exit(1)

    return create_client(url, key)


def upload_hexagons(client: Client, hexagons: list, source_file: str) -> int:
    """
    Upload hexagons to Supabase.

    Args:
        client: Supabase client
        hexagons: List of hexagon dictionaries
        source_file: Source file name for tracking

    Returns:
        Number of hexagons uploaded
    """
    # Prepare records
    records = []
    for hex_data in hexagons:
        records.append({
            'hex_id': hex_data.get('hex_id', ''),
            'coordinates': hex_data.get('coordinates', []),
            'layer_name': 'active_clients',
            'source_file': source_file
        })

    # Delete existing records for this layer
    print("Clearing existing hexagons...")
    client.table('kyivstar_hexagons').delete().eq('layer_name', 'active_clients').execute()

    # Insert new records (in batches of 100)
    batch_size = 100
    total_inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        result = client.table('kyivstar_hexagons').insert(batch).execute()
        total_inserted += len(batch)
        print(f"  Uploaded {total_inserted}/{len(records)} hexagons...")

    return total_inserted


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 upload_kyivstar_data.py <json_file>")
        print("\nExample:")
        print("  python3 upload_kyivstar_data.py data/kyivstar_hexagons.json")
        sys.exit(1)

    json_file = Path(sys.argv[1])

    if not json_file.exists():
        print(f"Error: File not found: {json_file}")
        sys.exit(1)

    # Read JSON data
    print(f"Reading {json_file}...")
    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)

    hexagons = data.get('hexagons', [])
    source_file = data.get('source', str(json_file.name))

    print(f"Found {len(hexagons)} hexagons from {source_file}")

    # Create Supabase client
    print("\nConnecting to Supabase...")
    client = get_supabase_client()

    # Upload hexagons
    print("\nUploading hexagons...")
    count = upload_hexagons(client, hexagons, source_file)

    print(f"\nDone! Uploaded {count} hexagons to Supabase.")


if __name__ == '__main__':
    main()
