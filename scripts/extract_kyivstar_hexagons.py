#!/usr/bin/env python3
"""
Extract Kyivstar hexagons from Folium HTML map.
Extracts the "Діючі клієнти Apollo" layer and converts to JSON for Supabase.

Usage:
    python3 extract_kyivstar_hexagons.py <input_html> [output_json]
"""

import re
import json
import sys
from pathlib import Path


def extract_hexagons(html_content: str, target_feature_group: str) -> list:
    """
    Extract hexagon polygons from HTML that belong to a specific feature group.

    Args:
        html_content: The full HTML content
        target_feature_group: The feature group ID (e.g., 'feature_group_8d5633c97758493aefc4f0b8fd4b8009')

    Returns:
        List of hexagon dictionaries with hex_id and coordinates
    """
    hexagons = []

    # Find all geo_json variable names that are added to the target feature group
    addto_pattern = rf'(geo_json_[a-f0-9]+)\.addTo\({target_feature_group}\)'
    geo_json_vars = re.findall(addto_pattern, html_content)

    print(f"Found {len(geo_json_vars)} geo_json objects in {target_feature_group}")

    # For each geo_json variable, find its data
    for geo_json_var in geo_json_vars:
        # Pattern to find the geo_json_xxx_add call with its GeoJSON data
        data_pattern = rf'{geo_json_var}_add\((\{{"features".*?"type":\s*"FeatureCollection"\}})\)'
        match = re.search(data_pattern, html_content)

        if match:
            try:
                geojson_str = match.group(1)
                geojson = json.loads(geojson_str)

                for feature in geojson.get('features', []):
                    if feature.get('type') == 'Feature':
                        geometry = feature.get('geometry', {})
                        properties = feature.get('properties', {})

                        if geometry.get('type') == 'Polygon':
                            # GeoJSON coordinates are [lng, lat], Leaflet expects [lat, lng]
                            raw_coords = geometry.get('coordinates', [[]])[0]
                            # Convert [lng, lat] to [lat, lng]
                            coords = [[coord[1], coord[0]] for coord in raw_coords]

                            hexagons.append({
                                'hex_id': properties.get('hex_id', ''),
                                'coordinates': coords
                            })
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse GeoJSON for {geo_json_var}: {e}")

    return hexagons


def find_feature_group_for_layer(html_content: str, layer_name: str) -> str | None:
    """
    Find the feature group variable name for a given layer name.

    Args:
        html_content: The full HTML content
        layer_name: The layer name to search for (e.g., "Діючі клієнти Apollo")

    Returns:
        Feature group variable name or None
    """
    # Find the overlays section and parse it
    # The HTML contains unicode-escaped layer names like:
    # "\ud83d\udfe2 \u0414\u0456\u044e\u0447\u0456 \u043a\u043b\u0456\u0454\u043d\u0442\u0438 Apollo" : feature_group_xxx

    # Find all feature groups with "Apollo" in their layer name
    pattern = r'"([^"]*Apollo[^"]*)"\s*:\s*(feature_group_[a-f0-9]+)'
    matches = re.findall(pattern, html_content)

    for layer_text, feature_group in matches:
        # Decode unicode escapes to check the actual text
        try:
            decoded = layer_text.encode().decode('unicode_escape')
            # Check if this is the "Діючі клієнти" (active clients) layer
            # It has a green circle emoji 🟢 (\ud83d\udfe2)
            if 'Діючі' in decoded or '\U0001f7e2' in decoded:
                return feature_group
        except:
            pass

    # Fallback: look for green circle emoji pattern directly
    green_pattern = r'"\\ud83d\\udfe2[^"]*"\s*:\s*(feature_group_[a-f0-9]+)'
    match = re.search(green_pattern, html_content)
    if match:
        return match.group(1)

    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 extract_kyivstar_hexagons.py <input_html> [output_json]")
        print("\nExample:")
        print("  python3 extract_kyivstar_hexagons.py 'hexagon_heatmap.html' hexagons.json")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file.with_suffix('.json')

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    print(f"Reading {input_file}...")
    html_content = input_file.read_text(encoding='utf-8')

    # Find the feature group for "Діючі клієнти Apollo"
    layer_name = "Діючі клієнти Apollo"
    feature_group = find_feature_group_for_layer(html_content, layer_name)

    if not feature_group:
        print(f"Error: Could not find feature group for layer '{layer_name}'")
        # Try to list available layers
        layers_pattern = r'overlays\s*:\s*\{([^}]+)\}'
        layers_match = re.search(layers_pattern, html_content)
        if layers_match:
            print("\nAvailable layers:")
            print(layers_match.group(1))
        sys.exit(1)

    print(f"Found feature group: {feature_group}")

    # Extract hexagons
    hexagons = extract_hexagons(html_content, feature_group)

    if not hexagons:
        print("Warning: No hexagons found!")
        sys.exit(1)

    print(f"Extracted {len(hexagons)} hexagons")

    # Save to JSON
    output_data = {
        'layer_name': 'active_clients',
        'source': str(input_file.name),
        'count': len(hexagons),
        'hexagons': hexagons
    }

    output_file.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Saved to {output_file}")

    # Print sample
    if hexagons:
        print(f"\nSample hexagon:")
        print(json.dumps(hexagons[0], indent=2))


if __name__ == '__main__':
    main()
