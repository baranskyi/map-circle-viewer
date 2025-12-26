#!/usr/bin/env python3
"""
Aggregate POI popular times data by H3 hexagons.

Creates a JSON file suitable for the heatmap visualization in map-circle-viewer.
"""

import json
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import h3

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'data'
INPUT_FILE = DATA_DIR / 'kyiv_popular_times.json'
OUTPUT_FILE = DATA_DIR / 'kyiv_heatmap_h3.json'

# H3 resolution (8 = ~460m diameter hexagon)
H3_RESOLUTION = 8

# Day names for reference
DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def load_popular_times() -> list:
    """Load popular times data."""
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['pois']


def get_h3_index(lat: float, lng: float, resolution: int = H3_RESOLUTION) -> str:
    """Convert lat/lng to H3 index."""
    # H3 v4.x API
    return h3.latlng_to_cell(lat, lng, resolution)


def h3_to_geo(h3_index: str) -> tuple:
    """Convert H3 index back to lat/lng."""
    # H3 v4.x API
    return h3.cell_to_latlng(h3_index)


def aggregate_by_h3(pois: list) -> dict:
    """
    Aggregate POI data by H3 hexagon.

    Returns a structure:
    {
        h3_index: {
            'lat': center_lat,
            'lng': center_lng,
            'poi_count': N,
            'poi_types': ['restaurant', 'cafe', ...],
            'by_type': {
                'restaurant': {
                    'count': N,
                    'hours': {
                        0: { 0-23 hourly averages },
                        1: { ... },
                        ...
                    }
                },
                ...
            },
            'hours': {
                0: { 0-23 hourly averages (all types) },
                ...
            }
        }
    }
    """
    hexagons = defaultdict(lambda: {
        'poi_count': 0,
        'poi_types': set(),
        'by_type': defaultdict(lambda: {
            'count': 0,
            'hours': defaultdict(lambda: defaultdict(list))
        }),
        'hours': defaultdict(lambda: defaultdict(list))
    })

    for poi in pois:
        try:
            h3_index = get_h3_index(poi['lat'], poi['lng'])
        except Exception as e:
            print(f"Error converting {poi['name']}: {e}")
            continue

        poi_type = poi['poi_type']
        pop_times = poi.get('populartimes', [])

        hex_data = hexagons[h3_index]
        hex_data['poi_count'] += 1
        hex_data['poi_types'].add(poi_type)

        # Aggregate by type
        type_data = hex_data['by_type'][poi_type]
        type_data['count'] += 1

        # Process popular times
        for day_idx, day_data in enumerate(pop_times):
            hourly = day_data.get('data', [])
            for hour, value in enumerate(hourly[:24]):
                # By type
                type_data['hours'][day_idx][hour].append(value)
                # All types combined
                hex_data['hours'][day_idx][hour].append(value)

    # Convert to final format
    result = {}
    for h3_index, hex_data in hexagons.items():
        center = h3_to_geo(h3_index)

        # Calculate averages
        hours_avg = {}
        for day_idx in range(7):
            hours_avg[day_idx] = {}
            for hour in range(24):
                values = hex_data['hours'][day_idx][hour]
                hours_avg[day_idx][hour] = sum(values) / len(values) if values else 0

        by_type_avg = {}
        for poi_type, type_data in hex_data['by_type'].items():
            type_hours = {}
            for day_idx in range(7):
                type_hours[day_idx] = {}
                for hour in range(24):
                    values = type_data['hours'][day_idx][hour]
                    type_hours[day_idx][hour] = sum(values) / len(values) if values else 0

            by_type_avg[poi_type] = {
                'count': type_data['count'],
                'hours': type_hours
            }

        result[h3_index] = {
            'lat': center[0],
            'lng': center[1],
            'poi_count': hex_data['poi_count'],
            'poi_types': list(hex_data['poi_types']),
            'by_type': by_type_avg,
            'hours': hours_avg
        }

    return result


def create_heatmap_points(hexagons: dict) -> list:
    """
    Create simple heatmap points for each hour/day combination.

    Returns a flat structure that's easy to filter in frontend:
    [
        {
            'h3': 'hex_id',
            'lat': lat,
            'lng': lng,
            'day': 0-6,
            'hour': 0-23,
            'intensity': 0-100,
            'poi_count': N,
            'by_type': { 'restaurant': intensity, ... }
        },
        ...
    ]
    """
    points = []

    for h3_index, hex_data in hexagons.items():
        for day in range(7):
            for hour in range(24):
                # Get intensity for all types
                intensity = hex_data['hours'][day][hour]

                # Get intensity by type
                by_type = {}
                for poi_type, type_data in hex_data['by_type'].items():
                    by_type[poi_type] = type_data['hours'][day][hour]

                points.append({
                    'h3': h3_index,
                    'lat': hex_data['lat'],
                    'lng': hex_data['lng'],
                    'day': day,
                    'hour': hour,
                    'intensity': round(intensity, 1),
                    'poi_count': hex_data['poi_count'],
                    'poi_types': hex_data['poi_types'],
                    'by_type': {k: round(v, 1) for k, v in by_type.items()}
                })

    return points


def main():
    print("=" * 60)
    print("H3 Heatmap Aggregator")
    print("=" * 60)
    print(f"H3 Resolution: {H3_RESOLUTION} (~{['1.2km', '461m', '174m', '66m'][H3_RESOLUTION - 7]} diameter)")
    print()

    if not INPUT_FILE.exists():
        print(f"ERROR: Input file not found: {INPUT_FILE}")
        print("Run scrape_popular_times.py first!")
        return

    # Load data
    print("Loading popular times data...")
    pois = load_popular_times()
    print(f"  Loaded {len(pois)} POIs")

    # Aggregate by H3
    print("Aggregating by H3 hexagons...")
    hexagons = aggregate_by_h3(pois)
    print(f"  Created {len(hexagons)} hexagons")

    # Create heatmap points
    print("Creating heatmap points...")
    points = create_heatmap_points(hexagons)
    print(f"  Created {len(points)} points (7 days × 24 hours × {len(hexagons)} hexagons)")

    # Save output
    output = {
        'metadata': {
            'created_at': datetime.now().isoformat(),
            'h3_resolution': H3_RESOLUTION,
            'hexagon_count': len(hexagons),
            'point_count': len(points),
            'poi_count': len(pois),
            'days': DAY_NAMES
        },
        'hexagons': hexagons,
        'points': points
    }

    print(f"Saving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)

    # Size info
    file_size = OUTPUT_FILE.stat().st_size / 1024 / 1024
    print(f"  File size: {file_size:.2f} MB")

    print()
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"  Hexagons: {len(hexagons)}")
    print(f"  Points: {len(points):,}")
    print(f"  Output: {OUTPUT_FILE}")

    # Print sample hexagon
    print()
    print("Sample hexagon:")
    sample_hex = list(hexagons.keys())[0]
    sample = hexagons[sample_hex]
    print(f"  H3: {sample_hex}")
    print(f"  Location: ({sample['lat']:.4f}, {sample['lng']:.4f})")
    print(f"  POI count: {sample['poi_count']}")
    print(f"  Types: {sample['poi_types']}")
    print(f"  Monday 12:00: {sample['hours'][0][12]:.1f}")
    print(f"  Saturday 18:00: {sample['hours'][5][18]:.1f}")


if __name__ == '__main__':
    main()
