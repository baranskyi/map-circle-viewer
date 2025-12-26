#!/usr/bin/env python3
"""
Optimize heatmap data for frontend.

Creates a compact JSON format that's faster to load and process.
"""

import json
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'data'
INPUT_FILE = DATA_DIR / 'kyiv_heatmap_h3.json'
OUTPUT_FILE = DATA_DIR / 'kyiv_heatmap_optimized.json'

# Also copy to public folder for frontend
PUBLIC_FILE = SCRIPT_DIR.parent / 'public' / 'heatmap_data.json'


def main():
    print("Loading full heatmap data...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    hexagons = data['hexagons']
    print(f"  Loaded {len(hexagons)} hexagons")

    # Create optimized format:
    # {
    #   hexagons: [
    #     { lat, lng, poi_count, types, intensity: [[day0_hours], [day1_hours], ...] }
    #   ],
    #   by_type: {
    #     'restaurant': [ [hex0_intensity_168], [hex1_intensity_168], ... ]
    #   }
    # }

    optimized_hexagons = []
    types_intensity = {}  # poi_type -> list of hex intensities

    # Get all unique types
    all_types = set()
    for hex_data in hexagons.values():
        all_types.update(hex_data['poi_types'])

    for poi_type in all_types:
        types_intensity[poi_type] = []

    for h3_index, hex_data in hexagons.items():
        # Compact intensity: 7 arrays of 24 values each
        intensity = []
        for day in range(7):
            day_hours = []
            for hour in range(24):
                day_hours.append(round(hex_data['hours'][str(day)][str(hour)], 1))
            intensity.append(day_hours)

        optimized_hexagons.append({
            'h3': h3_index,
            'lat': round(hex_data['lat'], 5),
            'lng': round(hex_data['lng'], 5),
            'n': hex_data['poi_count'],  # short name for size
            't': hex_data['poi_types'],  # short name for size
            'i': intensity  # 7 x 24 = 168 values
        })

        # Per-type intensity
        for poi_type in all_types:
            type_intensity = []
            if poi_type in hex_data['by_type']:
                for day in range(7):
                    day_hours = []
                    for hour in range(24):
                        val = hex_data['by_type'][poi_type]['hours'][str(day)][str(hour)]
                        day_hours.append(round(val, 1))
                    type_intensity.append(day_hours)
            else:
                # No data for this type in this hex
                type_intensity = [[0] * 24 for _ in range(7)]

            types_intensity[poi_type].append(type_intensity)

    output = {
        'meta': {
            'created': datetime.now().isoformat(),
            'hex_count': len(optimized_hexagons),
            'types': list(all_types),
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        'hexagons': optimized_hexagons,
        'by_type': types_intensity
    }

    # Save to data folder
    print(f"Saving optimized data to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'))  # No spaces for smaller size

    file_size = OUTPUT_FILE.stat().st_size / 1024 / 1024
    print(f"  Size: {file_size:.2f} MB")

    # Also save to public folder
    PUBLIC_FILE.parent.mkdir(exist_ok=True)
    print(f"Saving to public folder: {PUBLIC_FILE}...")
    with open(PUBLIC_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'))

    public_size = PUBLIC_FILE.stat().st_size / 1024 / 1024
    print(f"  Size: {public_size:.2f} MB")

    # Also create a super-compact version with just hexagon locations and overall intensity
    # This is for initial load - type-specific data can be loaded on demand
    compact = {
        'meta': output['meta'],
        'hexagons': [
            {
                'lat': h['lat'],
                'lng': h['lng'],
                'n': h['n'],
                'i': h['i']
            }
            for h in optimized_hexagons
        ]
    }

    compact_file = PUBLIC_FILE.parent / 'heatmap_compact.json'
    print(f"Saving compact version: {compact_file}...")
    with open(compact_file, 'w', encoding='utf-8') as f:
        json.dump(compact, f, separators=(',', ':'))

    compact_size = compact_file.stat().st_size / 1024 / 1024
    print(f"  Size: {compact_size:.2f} MB")

    print()
    print("Done!")
    print(f"  Full data: {file_size:.2f} MB")
    print(f"  Compact (no types): {compact_size:.2f} MB")


if __name__ == '__main__':
    main()
