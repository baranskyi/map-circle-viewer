#!/usr/bin/env python3
"""
Fetch Shopping Malls from OpenStreetMap via Overpass API
for major Ukrainian cities
"""

import json
import requests
from datetime import datetime
import os

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Major Ukrainian cities with coordinates
CITIES = [
    {"name": "Kyiv", "name_uk": "Київ", "lat": 50.4501, "lng": 30.5234},
    {"name": "Lviv", "name_uk": "Львів", "lat": 49.8397, "lng": 24.0297},
    {"name": "Kharkiv", "name_uk": "Харків", "lat": 49.9935, "lng": 36.2304},
    {"name": "Odesa", "name_uk": "Одеса", "lat": 46.4825, "lng": 30.7233},
    {"name": "Dnipro", "name_uk": "Дніпро", "lat": 48.4647, "lng": 35.0462},
]


def fetch_malls_for_city(city):
    """Fetch shopping malls for a specific city"""

    # Query for shopping malls within 30km radius of city center
    query = f"""
    [out:json][timeout:60];
    (
      node["shop"="mall"](around:30000,{city['lat']},{city['lng']});
      way["shop"="mall"](around:30000,{city['lat']},{city['lng']});
      relation["shop"="mall"](around:30000,{city['lat']},{city['lng']});
      node["building"="mall"](around:30000,{city['lat']},{city['lng']});
      way["building"="mall"](around:30000,{city['lat']},{city['lng']});
    );
    out center;
    """

    print(f"  Fetching malls for {city['name']}...")

    response = requests.post(OVERPASS_URL, data={'data': query})

    if response.status_code != 200:
        print(f"  Error: {response.status_code}")
        return []

    data = response.json()
    elements = data.get('elements', [])

    malls = []
    seen_names = set()

    for elem in elements:
        tags = elem.get('tags', {})
        name = tags.get('name', tags.get('name:uk', tags.get('name:en', '')))

        if not name or name in seen_names:
            continue
        seen_names.add(name)

        # Get coordinates (center for ways/relations)
        if elem.get('type') == 'node':
            lat = elem.get('lat')
            lng = elem.get('lon')
        else:
            center = elem.get('center', {})
            lat = center.get('lat')
            lng = center.get('lon')

        if not lat or not lng:
            continue

        mall = {
            'osm_id': elem.get('id'),
            'osm_type': elem.get('type'),
            'name': name,
            'name_uk': tags.get('name:uk', name),
            'name_en': tags.get('name:en', ''),
            'lat': lat,
            'lng': lng,
            'city': city['name'],
            'city_uk': city['name_uk'],
            'address': tags.get('addr:full', tags.get('addr:street', '')),
            'website': tags.get('website', tags.get('contact:website', '')),
            'phone': tags.get('phone', tags.get('contact:phone', '')),
            'opening_hours': tags.get('opening_hours', ''),
        }
        malls.append(mall)

    print(f"  Found {len(malls)} malls in {city['name']}")
    return malls


def fetch_all_malls():
    """Fetch malls for all cities"""

    print("=" * 50)
    print("Shopping Malls Fetcher (OSM)")
    print("=" * 50)

    all_malls = []

    for city in CITIES:
        malls = fetch_malls_for_city(city)
        all_malls.extend(malls)

    print(f"\nTotal: {len(all_malls)} shopping malls")
    return all_malls


def save_to_json(malls, filename='shopping_malls.json'):
    """Save malls to JSON file"""
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'source': 'OpenStreetMap Overpass API',
            'count': len(malls),
            'malls': malls
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")
    return output_path


def generate_sql(malls):
    """Generate SQL insert statements"""
    output_path = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations', '004_seed_shopping_malls.sql')

    sql_lines = [
        "-- Seed Shopping Malls",
        "-- Source: OpenStreetMap Overpass API",
        f"-- Generated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
        "DO $$",
        "DECLARE",
        "    mall_layer_id UUID;",
        "    kyiv_id UUID;",
        "    lviv_id UUID;",
        "    kharkiv_id UUID;",
        "    odesa_id UUID;",
        "    dnipro_id UUID;",
        "BEGIN",
        "    SELECT id INTO mall_layer_id FROM poi_layers WHERE name = 'Shopping Malls' LIMIT 1;",
        "    SELECT id INTO kyiv_id FROM cities WHERE name = 'Kyiv' LIMIT 1;",
        "    SELECT id INTO lviv_id FROM cities WHERE name = 'Lviv' LIMIT 1;",
        "    SELECT id INTO kharkiv_id FROM cities WHERE name = 'Kharkiv' LIMIT 1;",
        "    SELECT id INTO odesa_id FROM cities WHERE name = 'Odesa' LIMIT 1;",
        "    SELECT id INTO dnipro_id FROM cities WHERE name = 'Dnipro' LIMIT 1;",
        "",
        "    INSERT INTO poi_points (layer_id, city_id, name, name_uk, brand, lat, lng, address, website, phone, source, source_id) VALUES"
    ]

    city_var_map = {
        'Kyiv': 'kyiv_id',
        'Lviv': 'lviv_id',
        'Kharkiv': 'kharkiv_id',
        'Odesa': 'odesa_id',
        'Dnipro': 'dnipro_id',
    }

    values = []
    for mall in malls:
        city_var = city_var_map.get(mall['city'], 'kyiv_id')
        name = mall['name'].replace("'", "''")
        name_uk = mall['name_uk'].replace("'", "''")
        address = (mall.get('address') or '').replace("'", "''")
        website = (mall.get('website') or '').replace("'", "''")
        phone = (mall.get('phone') or '').replace("'", "''")

        values.append(
            f"    (mall_layer_id, {city_var}, '{name}', '{name_uk}', 'Shopping Mall', "
            f"{mall['lat']}, {mall['lng']}, '{address}', '{website}', '{phone}', "
            f"'OSM', '{mall['osm_id']}')"
        )

    sql_lines.append(',\n'.join(values))
    sql_lines.append("    ON CONFLICT DO NOTHING;")
    sql_lines.append("")
    sql_lines.append("    RAISE NOTICE 'Inserted shopping malls';")
    sql_lines.append("END $$;")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Generated SQL: {output_path}")
    return output_path


if __name__ == '__main__':
    malls = fetch_all_malls()

    if malls:
        save_to_json(malls)
        generate_sql(malls)

        print("\nSample malls:")
        for m in malls[:5]:
            print(f"  - {m['name_uk']} ({m['city']})")

    print("\nDone!")
