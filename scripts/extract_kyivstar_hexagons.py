#!/usr/bin/env python3
"""
Extract Kyivstar hexagons from Folium HTML map.
Extracts the "Діючі клієнти Apollo" layer and converts to JSON for Supabase.
Now includes statistics and color data from popups.

Usage:
    python3 extract_kyivstar_hexagons.py <input_html> [output_json]
"""

import re
import json
import sys
from pathlib import Path
from html.parser import HTMLParser


class PopupHTMLParser(HTMLParser):
    """Parse popup HTML to extract statistics."""
    def __init__(self):
        super().__init__()
        self.stats = {
            'home_only': 0,
            'work_only': 0,
            'home_and_work': 0,
            'total': 0
        }
        self.gyms = []
        self.current_gym = None
        self.in_gym_name = False
        self.in_gym_stats = False
        self.capture_next = None

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        # Parse statistics
        if '🏠 Тільки дім:' in data:
            self.capture_next = 'home_only'
        elif '🏢 Тільки робота:' in data:
            self.capture_next = 'work_only'
        elif '🏠🏢 Дім і робота:' in data:
            self.capture_next = 'home_and_work'
        elif '📊 Всього:' in data:
            self.capture_next = 'total'
        elif self.capture_next and data.isdigit():
            self.stats[self.capture_next] = int(data)
            self.capture_next = None

        # Parse gym info
        if '📍' in data:
            self.current_gym = {'address': data.replace('📍 ', '').strip()}
        elif self.current_gym and 'чол.' in data:
            # Extract count: "11 чол. (100.0%)"
            match = re.search(r'(\d+)\s*чол\.', data)
            if match:
                self.current_gym['count'] = int(match.group(1))
            # Extract breakdown
            breakdown_match = re.search(r'🏠(\d+)\s*🏢(\d+)\s*🏠🏢(\d+)', data)
            if breakdown_match:
                self.current_gym['home'] = int(breakdown_match.group(1))
                self.current_gym['work'] = int(breakdown_match.group(2))
                self.current_gym['both'] = int(breakdown_match.group(3))
            self.gyms.append(self.current_gym)
            self.current_gym = None


def parse_popup_html(html_content: str) -> dict:
    """Parse popup HTML and extract statistics."""
    parser = PopupHTMLParser()
    try:
        parser.feed(html_content)
    except:
        pass
    return {
        'stats': parser.stats,
        'gyms': parser.gyms
    }


def extract_hexagons(html_content: str, target_feature_group: str) -> list:
    """
    Extract hexagon polygons from HTML that belong to a specific feature group.
    Now includes color and statistics.
    """
    hexagons = []

    # Find all geo_json variable names that are added to the target feature group
    addto_pattern = rf'(geo_json_[a-f0-9]+)\.addTo\({target_feature_group}\)'
    geo_json_vars = re.findall(addto_pattern, html_content)

    print(f"Found {len(geo_json_vars)} geo_json objects in {target_feature_group}")

    # Build a map of geo_json_var -> fillColor
    color_map = {}
    color_pattern = r'var\s+(geo_json_[a-f0-9]+)\s*=.*?"fillColor":\s*"([^"]+)"'
    for match in re.finditer(color_pattern, html_content, re.DOTALL):
        var_name = match.group(1)
        fill_color = match.group(2)
        color_map[var_name] = fill_color

    # Build a map of geo_json_var -> popup content
    popup_map = {}
    # First find popup var -> geo_json var mapping
    popup_binding_pattern = r'(geo_json_[a-f0-9]+)\.bindPopup\((popup_[a-f0-9]+)\)'
    for match in re.finditer(popup_binding_pattern, html_content):
        geo_var = match.group(1)
        popup_var = match.group(2)
        popup_map[geo_var] = popup_var

    # Then find popup var -> html var mapping and html content
    popup_content_map = {}
    html_pattern = r'var\s+(html_[a-f0-9]+)\s*=\s*\$\(`([^`]+)`\)'
    for match in re.finditer(html_pattern, html_content, re.DOTALL):
        html_var = match.group(1)
        html_content_str = match.group(2)
        popup_content_map[html_var] = html_content_str

    popup_to_html_pattern = r'(popup_[a-f0-9]+)\.setContent\((html_[a-f0-9]+)\)'
    popup_html_map = {}
    for match in re.finditer(popup_to_html_pattern, html_content):
        popup_var = match.group(1)
        html_var = match.group(2)
        if html_var in popup_content_map:
            popup_html_map[popup_var] = popup_content_map[html_var]

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

                            hex_id = properties.get('hex_id', '')

                            # Get color
                            fill_color = color_map.get(geo_json_var, '#22c55e')

                            # Get popup statistics
                            stats = {'home_only': 0, 'work_only': 0, 'home_and_work': 0, 'total': 0}
                            gyms = []
                            if geo_json_var in popup_map:
                                popup_var = popup_map[geo_json_var]
                                if popup_var in popup_html_map:
                                    popup_data = parse_popup_html(popup_html_map[popup_var])
                                    stats = popup_data['stats']
                                    gyms = popup_data['gyms']

                            hexagons.append({
                                'hex_id': hex_id,
                                'coordinates': coords,
                                'fill_color': fill_color,
                                'stats': stats,
                                'gyms': gyms
                            })
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse GeoJSON for {geo_json_var}: {e}")

    return hexagons


def find_feature_group_for_layer(html_content: str, layer_name: str) -> str | None:
    """
    Find the feature group variable name for a given layer name.
    """
    # Find all feature groups with "Apollo" in their layer name
    pattern = r'"([^"]*Apollo[^"]*)"\s*:\s*(feature_group_[a-f0-9]+)'
    matches = re.findall(pattern, html_content)

    for layer_text, feature_group in matches:
        try:
            decoded = layer_text.encode().decode('unicode_escape')
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

    # Calculate stats
    total_people = sum(h['stats']['total'] for h in hexagons)
    with_stats = sum(1 for h in hexagons if h['stats']['total'] > 0)
    print(f"Total people: {total_people}, hexagons with stats: {with_stats}")

    # Save to JSON
    output_data = {
        'layer_name': 'active_clients',
        'source': str(input_file.name),
        'count': len(hexagons),
        'total_people': total_people,
        'hexagons': hexagons
    }

    output_file.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Saved to {output_file}")

    # Print sample
    if hexagons:
        print(f"\nSample hexagon:")
        sample = hexagons[0]
        print(json.dumps({
            'hex_id': sample['hex_id'],
            'fill_color': sample['fill_color'],
            'stats': sample['stats'],
            'gyms_count': len(sample['gyms']),
            'coordinates_count': len(sample['coordinates'])
        }, indent=2))


if __name__ == '__main__':
    main()
