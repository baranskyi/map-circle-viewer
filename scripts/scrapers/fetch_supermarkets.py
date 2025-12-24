#!/usr/bin/env python3
"""
Fetch Supermarkets from OpenStreetMap via Overpass API
for major Ukrainian cities
"""

import json
import requests
from datetime import datetime
import os
import time

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Major Ukrainian cities with coordinates
CITIES = [
    {"name": "Kyiv", "name_uk": "Київ", "lat": 50.4501, "lng": 30.5234},
    {"name": "Lviv", "name_uk": "Львів", "lat": 49.8397, "lng": 24.0297},
    {"name": "Kharkiv", "name_uk": "Харків", "lat": 49.9935, "lng": 36.2304},
    {"name": "Odesa", "name_uk": "Одеса", "lat": 46.4825, "lng": 30.7233},
    {"name": "Dnipro", "name_uk": "Дніпро", "lat": 48.4647, "lng": 35.0462},
]

# Known supermarket brands
SUPERMARKET_BRANDS = {
    'Сільпо': 'Silpo',
    'Silpo': 'Silpo',
    'АТБ': 'ATB',
    'ATB': 'ATB',
    'Novus': 'Novus',
    'Новус': 'Novus',
    'Фора': 'Fora',
    'Fora': 'Fora',
    'Велика Кишеня': 'Velyka Kyshenya',
    'Le Silpo': 'Le Silpo',
    'Varus': 'Varus',
    'Варус': 'Varus',
    'Близенько': 'Blyzenʹko',
    'Копійка': 'Kopiyka',
    'Рукавичка': 'Rukavychka',
    'METRO': 'METRO',
    'Метро': 'METRO',
}


def fetch_supermarkets_for_city(city, retries=2):
    """Fetch supermarkets for a specific city with retry logic"""

    query = f"""
    [out:json][timeout:90];
    (
      node["shop"="supermarket"](around:25000,{city['lat']},{city['lng']});
      way["shop"="supermarket"](around:25000,{city['lat']},{city['lng']});
    );
    out center;
    """

    print(f"  Fetching supermarkets for {city['name']}...")

    for attempt in range(retries + 1):
        try:
            response = requests.post(OVERPASS_URL, data={'data': query}, timeout=120)

            if response.status_code == 200:
                break
            elif response.status_code == 504 and attempt < retries:
                print(f"    Timeout, retrying in 10s...")
                time.sleep(10)
                continue
            else:
                print(f"  Error: {response.status_code}")
                return []
        except requests.exceptions.Timeout:
            if attempt < retries:
                print(f"    Request timeout, retrying in 10s...")
                time.sleep(10)
                continue
            return []

    data = response.json()
    elements = data.get('elements', [])

    markets = []
    seen = set()

    for elem in elements:
        tags = elem.get('tags', {})
        name = tags.get('name', tags.get('name:uk', ''))

        if not name:
            continue

        if elem.get('type') == 'node':
            lat = elem.get('lat')
            lng = elem.get('lon')
        else:
            center = elem.get('center', {})
            lat = center.get('lat')
            lng = center.get('lon')

        if not lat or not lng:
            continue

        loc_key = f"{name}_{round(lat, 4)}_{round(lng, 4)}"
        if loc_key in seen:
            continue
        seen.add(loc_key)

        # Detect brand
        brand = tags.get('brand', '')
        if not brand:
            for pattern, brand_name in SUPERMARKET_BRANDS.items():
                if pattern.lower() in name.lower():
                    brand = brand_name
                    break

        market = {
            'osm_id': elem.get('id'),
            'osm_type': elem.get('type'),
            'name': name,
            'name_uk': tags.get('name:uk', name),
            'brand': brand or 'Supermarket',
            'lat': lat,
            'lng': lng,
            'city': city['name'],
            'city_uk': city['name_uk'],
            'address': tags.get('addr:full', tags.get('addr:street', '')),
            'website': tags.get('website', ''),
            'phone': tags.get('phone', ''),
            'opening_hours': tags.get('opening_hours', ''),
        }
        markets.append(market)

    print(f"  Found {len(markets)} supermarkets in {city['name']}")
    return markets


def fetch_all_supermarkets():
    """Fetch supermarkets for all cities"""

    print("=" * 50)
    print("Supermarkets Fetcher (OSM)")
    print("=" * 50)

    all_markets = []

    for city in CITIES:
        markets = fetch_supermarkets_for_city(city)
        all_markets.extend(markets)
        time.sleep(2)  # Be nice to Overpass API

    print(f"\nTotal: {len(all_markets)} supermarkets")

    # Count by brand
    brands = {}
    for m in all_markets:
        b = m['brand']
        brands[b] = brands.get(b, 0) + 1

    print("\nBy brand:")
    for brand, count in sorted(brands.items(), key=lambda x: -x[1])[:10]:
        print(f"  {brand}: {count}")

    return all_markets


def save_to_json(markets, filename='supermarkets.json'):
    """Save markets to JSON file"""
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'source': 'OpenStreetMap Overpass API',
            'count': len(markets),
            'supermarkets': markets
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")
    return output_path


def generate_sql(markets):
    """Generate SQL insert statements"""
    output_path = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations', '006_seed_supermarkets.sql')

    sql_lines = [
        "-- Seed Supermarkets",
        "-- Source: OpenStreetMap Overpass API",
        f"-- Generated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
        "DO $$",
        "DECLARE",
        "    super_layer_id UUID;",
        "    kyiv_id UUID;",
        "    lviv_id UUID;",
        "    kharkiv_id UUID;",
        "    odesa_id UUID;",
        "    dnipro_id UUID;",
        "BEGIN",
        "    SELECT id INTO super_layer_id FROM poi_layers WHERE name = 'Supermarkets' LIMIT 1;",
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
    for market in markets:
        city_var = city_var_map.get(market['city'], 'kyiv_id')
        name = market['name'].replace("'", "''")
        name_uk = market['name_uk'].replace("'", "''")
        brand = market['brand'].replace("'", "''")
        address = (market.get('address') or '').replace("'", "''")
        website = (market.get('website') or '').replace("'", "''")
        phone = (market.get('phone') or '').replace("'", "''")

        values.append(
            f"    (super_layer_id, {city_var}, '{name}', '{name_uk}', '{brand}', "
            f"{market['lat']}, {market['lng']}, '{address}', '{website}', '{phone}', "
            f"'OSM', '{market['osm_id']}')"
        )

    sql_lines.append(',\n'.join(values))
    sql_lines.append("    ON CONFLICT DO NOTHING;")
    sql_lines.append("")
    sql_lines.append("    RAISE NOTICE 'Inserted supermarkets';")
    sql_lines.append("END $$;")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Generated SQL: {output_path}")
    return output_path


if __name__ == '__main__':
    markets = fetch_all_supermarkets()

    if markets:
        save_to_json(markets)
        generate_sql(markets)

        print("\nSample supermarkets:")
        for m in markets[:5]:
            print(f"  - {m['name_uk']} ({m['brand']}, {m['city']})")

    print("\nDone!")
