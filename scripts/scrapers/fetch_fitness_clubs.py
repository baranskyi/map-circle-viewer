#!/usr/bin/env python3
"""
Fetch Fitness Clubs from OpenStreetMap via Overpass API
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

# Known fitness club brands to filter
FITNESS_BRANDS = [
    'Sport Life', 'SportLife', 'Спорт Лайф',
    'FitCurves', 'Fit Curves', 'ФитКервс',
    'Планета Фитнес', 'Planet Fitness',
    'Sportclub', 'Sport Club',
    'MyFitness', 'My Fitness',
]


def fetch_fitness_for_city(city):
    """Fetch fitness clubs for a specific city"""

    # Query for fitness/gym facilities within 30km radius of city center
    query = f"""
    [out:json][timeout:60];
    (
      node["leisure"="fitness_centre"](around:30000,{city['lat']},{city['lng']});
      way["leisure"="fitness_centre"](around:30000,{city['lat']},{city['lng']});
      node["leisure"="sports_centre"](around:30000,{city['lat']},{city['lng']});
      way["leisure"="sports_centre"](around:30000,{city['lat']},{city['lng']});
      node["amenity"="gym"](around:30000,{city['lat']},{city['lng']});
      way["amenity"="gym"](around:30000,{city['lat']},{city['lng']});
    );
    out center;
    """

    print(f"  Fetching fitness clubs for {city['name']}...")

    response = requests.post(OVERPASS_URL, data={'data': query})

    if response.status_code != 200:
        print(f"  Error: {response.status_code}")
        return []

    data = response.json()
    elements = data.get('elements', [])

    clubs = []
    seen_names = set()

    for elem in elements:
        tags = elem.get('tags', {})
        name = tags.get('name', tags.get('name:uk', tags.get('name:en', '')))

        if not name:
            continue

        # Create unique key based on name and approximate location
        if elem.get('type') == 'node':
            lat = elem.get('lat')
            lng = elem.get('lon')
        else:
            center = elem.get('center', {})
            lat = center.get('lat')
            lng = center.get('lon')

        if not lat or not lng:
            continue

        # Round coords for deduplication
        loc_key = f"{name}_{round(lat, 3)}_{round(lng, 3)}"
        if loc_key in seen_names:
            continue
        seen_names.add(loc_key)

        # Detect brand
        brand = tags.get('brand', '')
        if not brand:
            name_lower = name.lower()
            for known_brand in FITNESS_BRANDS:
                if known_brand.lower() in name_lower:
                    brand = known_brand
                    break

        club = {
            'osm_id': elem.get('id'),
            'osm_type': elem.get('type'),
            'name': name,
            'name_uk': tags.get('name:uk', name),
            'name_en': tags.get('name:en', ''),
            'brand': brand or 'Fitness Club',
            'lat': lat,
            'lng': lng,
            'city': city['name'],
            'city_uk': city['name_uk'],
            'address': tags.get('addr:full', tags.get('addr:street', '')),
            'website': tags.get('website', tags.get('contact:website', '')),
            'phone': tags.get('phone', tags.get('contact:phone', '')),
            'opening_hours': tags.get('opening_hours', ''),
        }
        clubs.append(club)

    print(f"  Found {len(clubs)} fitness clubs in {city['name']}")
    return clubs


def fetch_all_fitness():
    """Fetch fitness clubs for all cities"""

    print("=" * 50)
    print("Fitness Clubs Fetcher (OSM)")
    print("=" * 50)

    all_clubs = []

    for city in CITIES:
        clubs = fetch_fitness_for_city(city)
        all_clubs.extend(clubs)

    print(f"\nTotal: {len(all_clubs)} fitness clubs")
    return all_clubs


def save_to_json(clubs, filename='fitness_clubs.json'):
    """Save clubs to JSON file"""
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'source': 'OpenStreetMap Overpass API',
            'count': len(clubs),
            'clubs': clubs
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")
    return output_path


def generate_sql(clubs):
    """Generate SQL insert statements"""
    output_path = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations', '005_seed_fitness_clubs.sql')

    sql_lines = [
        "-- Seed Fitness Clubs",
        "-- Source: OpenStreetMap Overpass API",
        f"-- Generated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
        "DO $$",
        "DECLARE",
        "    fitness_layer_id UUID;",
        "    kyiv_id UUID;",
        "    lviv_id UUID;",
        "    kharkiv_id UUID;",
        "    odesa_id UUID;",
        "    dnipro_id UUID;",
        "BEGIN",
        "    SELECT id INTO fitness_layer_id FROM poi_layers WHERE name = 'Fitness Clubs' LIMIT 1;",
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
    for club in clubs:
        city_var = city_var_map.get(club['city'], 'kyiv_id')
        name = club['name'].replace("'", "''")
        name_uk = club['name_uk'].replace("'", "''")
        brand = club['brand'].replace("'", "''")
        address = (club.get('address') or '').replace("'", "''")
        website = (club.get('website') or '').replace("'", "''")
        phone = (club.get('phone') or '').replace("'", "''")

        values.append(
            f"    (fitness_layer_id, {city_var}, '{name}', '{name_uk}', '{brand}', "
            f"{club['lat']}, {club['lng']}, '{address}', '{website}', '{phone}', "
            f"'OSM', '{club['osm_id']}')"
        )

    sql_lines.append(',\n'.join(values))
    sql_lines.append("    ON CONFLICT DO NOTHING;")
    sql_lines.append("")
    sql_lines.append("    RAISE NOTICE 'Inserted fitness clubs';")
    sql_lines.append("END $$;")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"Generated SQL: {output_path}")
    return output_path


if __name__ == '__main__':
    clubs = fetch_all_fitness()

    if clubs:
        save_to_json(clubs)
        generate_sql(clubs)

        print("\nSample clubs:")
        for c in clubs[:5]:
            print(f"  - {c['name_uk']} ({c['brand']}, {c['city']})")

    print("\nDone!")
