#!/usr/bin/env python3
"""
Fetch Kyiv Metro stations from OpenStreetMap via Overpass API
and upload to Supabase
"""

import os
import json
import requests
from datetime import datetime

# Supabase config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://fmsbzjwzyoheupbqzcwo.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

# Overpass API
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Kyiv Metro lines colors
METRO_LINES = {
    'M1': {'name': 'Святошинсько-Броварська', 'name_en': 'Sviatoshynsko-Brovarska', 'color': '#E4181C'},  # Red
    'M2': {'name': 'Оболонсько-Теремківська', 'name_en': 'Obolonsko-Teremkivska', 'color': '#0072BC'},    # Blue
    'M3': {'name': 'Сирецько-Печерська', 'name_en': 'Syretsko-Pecherska', 'color': '#009E49'},           # Green
}


def fetch_metro_stations():
    """Fetch metro stations from Overpass API"""

    # Overpass QL query for Kyiv metro stations
    query = """
    [out:json][timeout:60];
    area["name"="Київ"]["admin_level"="4"]->.kyiv;
    (
      node["railway"="station"]["station"="subway"](area.kyiv);
      node["railway"="subway_entrance"](area.kyiv);
    );
    out body;
    """

    print("Fetching Kyiv metro stations from Overpass API...")

    response = requests.post(OVERPASS_URL, data={'data': query})

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return []

    data = response.json()
    elements = data.get('elements', [])

    print(f"Found {len(elements)} elements")

    # Filter only stations (not entrances)
    stations = []
    for elem in elements:
        if elem.get('tags', {}).get('railway') == 'station':
            tags = elem.get('tags', {})

            # Determine metro line
            line = tags.get('ref', '')
            line_info = METRO_LINES.get(line, {'name': 'Unknown', 'color': '#666666'})

            station = {
                'osm_id': elem.get('id'),
                'name': tags.get('name', 'Unknown'),
                'name_uk': tags.get('name:uk', tags.get('name', '')),
                'name_en': tags.get('name:en', ''),
                'lat': elem.get('lat'),
                'lng': elem.get('lon'),
                'line': line,
                'line_name': line_info['name'],
                'line_color': line_info['color'],
                'wheelchair': tags.get('wheelchair', 'unknown'),
            }
            stations.append(station)

    print(f"Filtered {len(stations)} metro stations")
    return stations


def save_to_json(stations, filename='kyiv_metro.json'):
    """Save stations to JSON file"""
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'source': 'OpenStreetMap Overpass API',
            'count': len(stations),
            'stations': stations
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")
    return output_path


def upload_to_supabase(stations):
    """Upload stations to Supabase poi_points table"""

    if not SUPABASE_KEY:
        print("Warning: SUPABASE_SERVICE_KEY not set. Skipping upload.")
        return False

    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    # First, get the metro layer ID
    layer_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/poi_layers?name=eq.Metro%20Stations",
        headers=headers
    )

    if layer_response.status_code != 200:
        print(f"Error fetching layer: {layer_response.status_code}")
        return False

    layers = layer_response.json()
    if not layers:
        print("Metro Stations layer not found!")
        return False

    layer_id = layers[0]['id']
    print(f"Found Metro layer: {layer_id}")

    # Get Kyiv city ID
    city_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/cities?name=eq.Kyiv",
        headers=headers
    )

    city_id = None
    if city_response.status_code == 200 and city_response.json():
        city_id = city_response.json()[0]['id']
        print(f"Found Kyiv city: {city_id}")

    # Prepare data for upload
    poi_points = []
    for station in stations:
        poi_points.append({
            'layer_id': layer_id,
            'city_id': city_id,
            'name': station['name_en'] or station['name'],
            'name_uk': station['name_uk'],
            'brand': 'Kyiv Metro',
            'lat': station['lat'],
            'lng': station['lng'],
            'source': 'OSM',
            'source_id': str(station['osm_id']),
            'metadata': {
                'line': station['line'],
                'line_name': station['line_name'],
                'line_color': station['line_color'],
                'wheelchair': station['wheelchair']
            }
        })

    # Upload to Supabase
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/poi_points",
        headers=headers,
        json=poi_points
    )

    if response.status_code in [200, 201]:
        print(f"Successfully uploaded {len(poi_points)} metro stations!")
        return True
    else:
        print(f"Error uploading: {response.status_code}")
        print(response.text)
        return False


def main():
    print("=" * 50)
    print("Kyiv Metro Stations Fetcher")
    print("=" * 50)

    # Fetch stations
    stations = fetch_metro_stations()

    if not stations:
        print("No stations found!")
        return

    # Print sample
    print("\nSample stations:")
    for s in stations[:5]:
        print(f"  - {s['name_uk']} ({s['name_en']}) @ {s['lat']:.4f}, {s['lng']:.4f}")

    # Save to JSON
    json_path = save_to_json(stations)

    # Upload to Supabase (if key is set)
    upload_to_supabase(stations)

    print("\nDone!")


if __name__ == '__main__':
    main()
