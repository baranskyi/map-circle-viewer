#!/usr/bin/env python3
"""
Collect POIs from Kyiv using Overpass API (OpenStreetMap)
This script fetches all relevant POIs for popular times heatmap analysis.
"""

import json
import requests
import time
from datetime import datetime
from pathlib import Path

# Overpass API endpoint
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Kyiv bounding box (approximate)
KYIV_BBOX = {
    "south": 50.213,
    "west": 30.239,
    "north": 50.590,
    "east": 30.825
}

# POI types to collect with their OSM tags
POI_TYPES = {
    "restaurant": [
        'amenity=restaurant',
        'amenity=fast_food',
        'amenity=food_court',
    ],
    "cafe": [
        'amenity=cafe',
        'amenity=bar',
        'amenity=pub',
    ],
    "shopping_mall": [
        'shop=mall',
        'shop=department_store',
        'building=retail',
    ],
    "supermarket": [
        'shop=supermarket',
        'shop=convenience',
    ],
    "gym": [
        'leisure=fitness_centre',
        'leisure=sports_centre',
        'sport=fitness',
    ],
    "transit_station": [
        'railway=station',
        'station=subway',
        'amenity=bus_station',
        'public_transport=station',
    ],
    "park": [
        'leisure=park',
        'leisure=garden',
    ],
    "cinema": [
        'amenity=cinema',
        'amenity=theatre',
    ],
    "museum": [
        'tourism=museum',
        'tourism=gallery',
    ],
    "hospital": [
        'amenity=hospital',
        'amenity=clinic',
    ],
    "bank": [
        'amenity=bank',
    ],
    "pharmacy": [
        'amenity=pharmacy',
    ],
    "hotel": [
        'tourism=hotel',
        'tourism=hostel',
    ],
    "office": [
        'office=*',
        'building=office',
    ],
    "university": [
        'amenity=university',
        'amenity=college',
        'amenity=school',
    ],
}


def build_overpass_query(poi_type: str, tags: list) -> str:
    """Build Overpass QL query for given POI type."""
    bbox = f"{KYIV_BBOX['south']},{KYIV_BBOX['west']},{KYIV_BBOX['north']},{KYIV_BBOX['east']}"

    # Build node/way/relation queries for each tag
    queries = []
    for tag in tags:
        key, value = tag.split('=')
        if value == '*':
            # Wildcard value
            queries.append(f'node["{key}"]({bbox});')
            queries.append(f'way["{key}"]({bbox});')
        else:
            queries.append(f'node["{key}"="{value}"]({bbox});')
            queries.append(f'way["{key}"="{value}"]({bbox});')

    query = f"""
    [out:json][timeout:120];
    (
        {chr(10).join(queries)}
    );
    out center;
    """
    return query


def fetch_pois(poi_type: str, tags: list) -> list:
    """Fetch POIs from Overpass API."""
    query = build_overpass_query(poi_type, tags)

    print(f"  Fetching {poi_type}...")

    try:
        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            timeout=180
        )
        response.raise_for_status()
        data = response.json()

        pois = []
        for element in data.get('elements', []):
            # Get coordinates (center for ways, direct for nodes)
            if element['type'] == 'node':
                lat, lng = element['lat'], element['lon']
            elif 'center' in element:
                lat, lng = element['center']['lat'], element['center']['lon']
            else:
                continue

            tags = element.get('tags', {})
            name = tags.get('name', tags.get('name:uk', tags.get('name:en', 'Unknown')))

            pois.append({
                'osm_id': f"{element['type']}/{element['id']}",
                'name': name,
                'lat': lat,
                'lng': lng,
                'poi_type': poi_type,
                'address': tags.get('addr:street', '') + ' ' + tags.get('addr:housenumber', ''),
                'tags': {k: v for k, v in tags.items() if k.startswith('addr:') or k in ['name', 'website', 'phone', 'opening_hours']}
            })

        return pois

    except requests.exceptions.RequestException as e:
        print(f"    Error fetching {poi_type}: {e}")
        return []


def main():
    """Main function to collect all POIs."""
    print("=" * 60)
    print("Kyiv POI Collector - Overpass API")
    print("=" * 60)
    print(f"Started at: {datetime.now().isoformat()}")
    print(f"Bounding box: {KYIV_BBOX}")
    print()

    all_pois = []
    stats = {}

    for poi_type, tags in POI_TYPES.items():
        pois = fetch_pois(poi_type, tags)
        all_pois.extend(pois)
        stats[poi_type] = len(pois)
        print(f"    Found {len(pois)} {poi_type} POIs")

        # Rate limiting - be nice to Overpass API
        time.sleep(2)

    # Remove duplicates by osm_id
    seen = set()
    unique_pois = []
    for poi in all_pois:
        if poi['osm_id'] not in seen:
            seen.add(poi['osm_id'])
            unique_pois.append(poi)

    print()
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    for poi_type, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {poi_type}: {count}")
    print(f"  ---")
    print(f"  Total (with duplicates): {len(all_pois)}")
    print(f"  Total (unique): {len(unique_pois)}")

    # Save to JSON
    output_dir = Path(__file__).parent / 'data'
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / 'kyiv_pois.json'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'collected_at': datetime.now().isoformat(),
                'bbox': KYIV_BBOX,
                'total_count': len(unique_pois),
                'stats': stats
            },
            'pois': unique_pois
        }, f, ensure_ascii=False, indent=2)

    print()
    print(f"Saved to: {output_file}")
    print(f"Finished at: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
