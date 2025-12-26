#!/usr/bin/env python3
"""
Generate heatmap data for all configured cities.

This script runs the full pipeline for each city:
1. Collect POIs from OpenStreetMap via Overpass API
2. Generate synthetic popular times
3. Aggregate by H3 hexagons
4. Create optimized JSON for frontend

Usage:
    python generate_all_heatmaps.py [--cities kyiv,odesa,lviv] [--skip-existing]
"""

import json
import time
import argparse
import random
import math
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import requests

try:
    import h3
except ImportError:
    print("ERROR: h3 not installed. Run: pip install h3")
    exit(1)

from cities_config import CITIES, ALL_CITIES

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'data'
PUBLIC_DIR = SCRIPT_DIR.parent / 'public'

DATA_DIR.mkdir(exist_ok=True)
PUBLIC_DIR.mkdir(exist_ok=True)

# H3 resolution (8 = ~460m diameter hexagon)
H3_RESOLUTION = 8

# POI categories to collect
POI_CATEGORIES = {
    'restaurant': ['amenity=restaurant'],
    'cafe': ['amenity=cafe'],
    'bar': ['amenity=bar', 'amenity=pub'],
    'gym': ['leisure=fitness_centre', 'leisure=sports_centre'],
    'shopping_mall': ['shop=mall', 'shop=department_store'],
    'supermarket': ['shop=supermarket'],
    'transit_station': ['railway=station', 'public_transport=station', 'amenity=bus_station'],
    'office': ['office=*'],
    'hotel': ['tourism=hotel'],
    'hospital': ['amenity=hospital', 'amenity=clinic'],
    'university': ['amenity=university', 'amenity=college'],
    'park': ['leisure=park'],
}


def collect_pois_for_city(city_key: str) -> list:
    """Collect POIs for a city using Overpass API."""
    city = CITIES[city_key]
    bbox = city['bbox']
    bbox_str = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"

    print(f"  Collecting POIs for {city['name']}...")

    all_pois = []
    seen_ids = set()

    for category, tags in POI_CATEGORIES.items():
        for tag in tags:
            key, value = tag.split('=')

            query = f"""
            [out:json][timeout:60];
            (
              node["{key}"="{value}"]({bbox_str});
              way["{key}"="{value}"]({bbox_str});
            );
            out center;
            """

            if value == '*':
                query = f"""
                [out:json][timeout:60];
                (
                  node["{key}"]({bbox_str});
                  way["{key}"]({bbox_str});
                );
                out center;
                """

            try:
                response = requests.post(
                    'https://overpass-api.de/api/interpreter',
                    data={'data': query},
                    timeout=120
                )

                if response.status_code == 200:
                    data = response.json()
                    elements = data.get('elements', [])

                    for el in elements:
                        osm_id = f"{el['type']}/{el['id']}"
                        if osm_id in seen_ids:
                            continue
                        seen_ids.add(osm_id)

                        # Get coordinates
                        if el['type'] == 'node':
                            lat, lng = el['lat'], el['lon']
                        elif 'center' in el:
                            lat, lng = el['center']['lat'], el['center']['lon']
                        else:
                            continue

                        name = el.get('tags', {}).get('name', f"POI {el['id']}")

                        all_pois.append({
                            'osm_id': osm_id,
                            'name': name,
                            'lat': lat,
                            'lng': lng,
                            'poi_type': category,
                        })

                    print(f"    {category}/{tag}: {len(elements)} found")
                else:
                    print(f"    {category}/{tag}: HTTP {response.status_code}")

            except Exception as e:
                print(f"    {category}/{tag}: Error - {e}")

            time.sleep(1)  # Rate limiting

    print(f"  Total unique POIs: {len(all_pois)}")
    return all_pois


def generate_popular_times(poi: dict, city_center: tuple) -> list:
    """Generate synthetic popular times for a POI."""
    poi_type = poi['poi_type']

    # Seed for reproducibility
    random.seed(hash(poi['osm_id']) % (2**32))

    # Base patterns
    patterns = {
        'restaurant': {
            'weekday': [0, 0, 0, 0, 0, 0, 10, 15, 20, 15, 10, 20, 60, 70, 40, 20, 30, 50, 80, 100, 90, 70, 40, 10],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 10, 20, 30, 50, 70, 90, 100, 80, 60, 50, 60, 80, 100, 90, 70, 40, 10]
        },
        'cafe': {
            'weekday': [0, 0, 0, 0, 0, 5, 20, 50, 80, 100, 90, 70, 80, 70, 60, 50, 60, 70, 60, 40, 20, 10, 5, 0],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 10, 30, 60, 80, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0, 0]
        },
        'gym': {
            'weekday': [0, 0, 0, 0, 0, 5, 30, 70, 90, 60, 40, 50, 70, 50, 40, 50, 70, 100, 90, 80, 60, 30, 10, 0],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 20, 50, 80, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0, 0, 0]
        },
        'shopping_mall': {
            'weekday': [0, 0, 0, 0, 0, 0, 0, 5, 10, 30, 50, 60, 70, 60, 50, 60, 80, 100, 90, 80, 70, 50, 20, 5],
            'weekend': [0, 0, 0, 0, 0, 0, 0, 5, 10, 40, 70, 90, 100, 100, 90, 80, 90, 100, 90, 70, 50, 30, 10, 0]
        },
        'supermarket': {
            'weekday': [0, 0, 0, 0, 0, 0, 5, 20, 50, 70, 60, 50, 60, 50, 40, 50, 70, 100, 80, 60, 40, 20, 10, 5],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 10, 30, 60, 80, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0, 0]
        },
        'transit_station': {
            'weekday': [5, 0, 0, 0, 0, 10, 40, 90, 100, 70, 40, 30, 40, 40, 30, 40, 60, 100, 90, 60, 30, 20, 10, 5],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 20, 40, 60, 70, 80, 80, 70, 60, 50, 50, 60, 50, 40, 30, 20, 10, 5]
        },
        'office': {
            'weekday': [0, 0, 0, 0, 0, 0, 10, 50, 90, 100, 100, 90, 70, 80, 100, 100, 90, 70, 30, 10, 5, 0, 0, 0],
            'weekend': [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 15, 15, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        'bar': {
            'weekday': [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 20, 20, 15, 20, 30, 50, 70, 90, 100, 100, 80, 30],
            'weekend': [10, 5, 0, 0, 0, 0, 0, 0, 0, 5, 10, 20, 30, 30, 25, 30, 40, 60, 80, 100, 100, 100, 90, 50]
        },
        'park': {
            'weekday': [0, 0, 0, 0, 0, 5, 20, 40, 50, 40, 30, 40, 50, 40, 30, 40, 60, 80, 100, 80, 50, 30, 10, 0],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 20, 40, 60, 80, 100, 100, 100, 90, 80, 70, 60, 50, 40, 20, 10, 5, 0]
        },
    }

    pattern = patterns.get(poi_type, patterns.get('restaurant'))

    # Random modifiers
    intensity_mod = random.uniform(0.5, 1.5)
    time_shift = random.randint(-2, 2)
    day_variation = [random.uniform(0.7, 1.3) for _ in range(7)]

    # Location-based modulation
    lat_diff = abs(poi['lat'] - city_center[0]) * 111
    lng_diff = abs(poi['lng'] - city_center[1]) * 111 * math.cos(math.radians(poi['lat']))
    dist_km = math.sqrt(lat_diff**2 + lng_diff**2)

    if dist_km < 2:
        location_mod = 1.2 - (dist_km / 2) * 0.2
    elif dist_km < 5:
        location_mod = 1.0 - (dist_km - 2) / 3 * 0.2
    else:
        location_mod = max(0.5, 0.8 - (dist_km - 5) / 10 * 0.3)

    # Generate 7 days
    result = []
    for day_idx in range(7):
        is_weekend = day_idx >= 5
        base_pattern = pattern['weekend'] if is_weekend else pattern['weekday']

        # Apply time shift
        shifted_pattern = base_pattern[time_shift:] + base_pattern[:time_shift]

        # Apply modulations
        modified_pattern = []
        for hour, value in enumerate(shifted_pattern):
            hour_noise = random.uniform(0.85, 1.15)
            new_value = value * intensity_mod * day_variation[day_idx] * location_mod * hour_noise
            modified_pattern.append(int(max(0, min(100, new_value))))

        result.append({
            'name': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_idx],
            'data': modified_pattern
        })

    random.seed()
    return result


def aggregate_to_h3(pois_with_times: list) -> dict:
    """Aggregate POIs by H3 hexagons."""
    hexagons = defaultdict(lambda: {
        'poi_count': 0,
        'poi_types': set(),
        'hours': defaultdict(lambda: defaultdict(list))
    })

    for poi in pois_with_times:
        try:
            h3_index = h3.latlng_to_cell(poi['lat'], poi['lng'], H3_RESOLUTION)
        except:
            continue

        hex_data = hexagons[h3_index]
        hex_data['poi_count'] += 1
        hex_data['poi_types'].add(poi['poi_type'])

        for day_idx, day_data in enumerate(poi.get('populartimes', [])):
            for hour, value in enumerate(day_data.get('data', [])[:24]):
                hex_data['hours'][day_idx][hour].append(value)

    # Calculate averages
    result = {}
    for h3_index, hex_data in hexagons.items():
        center = h3.cell_to_latlng(h3_index)

        hours_avg = {}
        for day_idx in range(7):
            hours_avg[day_idx] = {}
            for hour in range(24):
                values = hex_data['hours'][day_idx][hour]
                hours_avg[day_idx][hour] = sum(values) / len(values) if values else 0

        result[h3_index] = {
            'lat': center[0],
            'lng': center[1],
            'poi_count': hex_data['poi_count'],
            'poi_types': list(hex_data['poi_types']),
            'hours': hours_avg
        }

    return result


def create_optimized_json(hexagons: dict, city_key: str) -> dict:
    """Create optimized JSON for frontend."""
    optimized_hexagons = []

    for h3_index, hex_data in hexagons.items():
        intensity = []
        for day in range(7):
            day_hours = []
            for hour in range(24):
                day_hours.append(round(hex_data['hours'][day][hour], 1))
            intensity.append(day_hours)

        optimized_hexagons.append({
            'lat': round(hex_data['lat'], 5),
            'lng': round(hex_data['lng'], 5),
            'n': hex_data['poi_count'],
            't': hex_data['poi_types'],
            'i': intensity
        })

    city = CITIES[city_key]
    return {
        'meta': {
            'city': city_key,
            'city_name': city['name'],
            'center': city['center'],
            'created': datetime.now().isoformat(),
            'hex_count': len(optimized_hexagons),
        },
        'hexagons': optimized_hexagons
    }


def process_city(city_key: str, skip_existing: bool = False) -> dict:
    """Process a single city through the full pipeline."""
    city = CITIES[city_key]
    output_file = PUBLIC_DIR / f'heatmap_{city_key}.json'

    if skip_existing and output_file.exists():
        print(f"Skipping {city['name']} (file exists)")
        return None

    print(f"\n{'='*60}")
    print(f"Processing {city['name']} ({city_key})")
    print(f"{'='*60}")

    # Step 1: Collect POIs
    pois = collect_pois_for_city(city_key)
    if not pois:
        print(f"  No POIs found for {city['name']}")
        return None

    # Step 2: Generate popular times
    print(f"  Generating popular times...")
    for poi in pois:
        poi['populartimes'] = generate_popular_times(poi, city['center'])

    # Step 3: Aggregate by H3
    print(f"  Aggregating by H3 hexagons...")
    hexagons = aggregate_to_h3(pois)
    print(f"    Created {len(hexagons)} hexagons")

    # Step 4: Create optimized JSON
    print(f"  Creating optimized JSON...")
    output = create_optimized_json(hexagons, city_key)

    # Save to public folder
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'))

    file_size = output_file.stat().st_size / 1024
    print(f"  Saved: {output_file.name} ({file_size:.1f} KB)")

    return output


def main():
    parser = argparse.ArgumentParser(description='Generate heatmaps for Ukrainian cities')
    parser.add_argument('--cities', type=str, default=','.join(ALL_CITIES),
                        help='Comma-separated list of city keys')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Skip cities that already have data files')
    args = parser.parse_args()

    cities_to_process = [c.strip() for c in args.cities.split(',')]

    print("="*60)
    print("Heatmap Generator for Ukrainian Cities")
    print("="*60)
    print(f"Cities: {', '.join(cities_to_process)}")

    results = {}
    for city_key in cities_to_process:
        if city_key not in CITIES:
            print(f"Unknown city: {city_key}")
            continue

        try:
            result = process_city(city_key, args.skip_existing)
            if result:
                results[city_key] = result['meta']
        except Exception as e:
            print(f"Error processing {city_key}: {e}")

    # Create cities index file
    cities_index = {
        'cities': {
            key: {
                'name': CITIES[key]['name'],
                'name_en': CITIES[key]['name_en'],
                'center': CITIES[key]['center'],
                'file': f'heatmap_{key}.json',
                'available': key in results or (PUBLIC_DIR / f'heatmap_{key}.json').exists()
            }
            for key in ALL_CITIES
        },
        'default': 'kyiv',
        'generated': datetime.now().isoformat()
    }

    index_file = PUBLIC_DIR / 'heatmap_cities.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(cities_index, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print("Summary:")
    print(f"{'='*60}")
    for city_key, meta in results.items():
        print(f"  {CITIES[city_key]['name']}: {meta['hex_count']} hexagons")
    print(f"\nCities index saved: {index_file.name}")


if __name__ == '__main__':
    main()
