#!/usr/bin/env python3
"""
Extract Kyivstar hexagons from Folium HTML map.
Extracts both "Діючі клієнти Apollo" and "Завершені клієнти Apollo" layers.

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
            match = re.search(r'(\d+)\s*чол\.', data)
            if match:
                self.current_gym['count'] = int(match.group(1))
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


def extract_hexagons(html_content: str, target_feature_group: str, layer_name: str) -> list:
    """Extract hexagon polygons from HTML that belong to a specific feature group."""
    hexagons = []

    addto_pattern = rf'(geo_json_[a-f0-9]+)\.addTo\({target_feature_group}\)'
    geo_json_vars = re.findall(addto_pattern, html_content)

    print(f"Found {len(geo_json_vars)} geo_json objects in {target_feature_group}")

    # Build popup maps
    popup_map = {}
    popup_binding_pattern = r'(geo_json_[a-f0-9]+)\.bindPopup\((popup_[a-f0-9]+)\)'
    for match in re.finditer(popup_binding_pattern, html_content):
        popup_map[match.group(1)] = match.group(2)

    popup_content_map = {}
    html_pattern = r'var\s+(html_[a-f0-9]+)\s*=\s*\$\(`([^`]+)`\)'
    for match in re.finditer(html_pattern, html_content, re.DOTALL):
        popup_content_map[match.group(1)] = match.group(2)

    popup_html_map = {}
    popup_to_html_pattern = r'(popup_[a-f0-9]+)\.setContent\((html_[a-f0-9]+)\)'
    for match in re.finditer(popup_to_html_pattern, html_content):
        if match.group(2) in popup_content_map:
            popup_html_map[match.group(1)] = popup_content_map[match.group(2)]

    for geo_json_var in geo_json_vars:
        data_pattern = rf'{geo_json_var}_add\((\{{"features".*?"type":\s*"FeatureCollection"\}})\)'
        match = re.search(data_pattern, html_content)

        if match:
            try:
                geojson = json.loads(match.group(1))

                for feature in geojson.get('features', []):
                    if feature.get('type') == 'Feature':
                        geometry = feature.get('geometry', {})
                        properties = feature.get('properties', {})

                        if geometry.get('type') == 'Polygon':
                            raw_coords = geometry.get('coordinates', [[]])[0]
                            coords = [[coord[1], coord[0]] for coord in raw_coords]
                            hex_id = properties.get('hex_id', '')

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
                                'layer_name': layer_name,
                                'stats': stats,
                                'gyms': gyms
                            })
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse GeoJSON for {geo_json_var}: {e}")

    return hexagons


def find_feature_groups(html_content: str) -> dict:
    """Find feature groups for both active and terminated clients layers."""
    layers = {}

    # Pattern to find all Apollo layers
    pattern = r'"([^"]*Apollo[^"]*)"\s*:\s*(feature_group_[a-f0-9]+)'
    matches = re.findall(pattern, html_content)

    for layer_text, feature_group in matches:
        try:
            decoded = layer_text.encode().decode('unicode_escape')
            if 'Діючі' in decoded or '\U0001f7e2' in decoded:
                layers['active_clients'] = feature_group
                print(f"Found active clients layer: {feature_group}")
            elif 'Завершені' in decoded or '\U0001f534' in decoded:
                layers['terminated_clients'] = feature_group
                print(f"Found terminated clients layer: {feature_group}")
        except:
            pass

    return layers


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 extract_kyivstar_hexagons.py <input_html> [output_json]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file.with_suffix('.json')

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    print(f"Reading {input_file}...")
    html_content = input_file.read_text(encoding='utf-8')

    # Find both layers
    layers = find_feature_groups(html_content)

    if not layers:
        print("Error: Could not find any Apollo client layers")
        sys.exit(1)

    all_hexagons = []

    # Extract active clients
    if 'active_clients' in layers:
        print("\nExtracting active clients...")
        active = extract_hexagons(html_content, layers['active_clients'], 'active_clients')
        all_hexagons.extend(active)
        total_active = sum(h['stats']['total'] for h in active)
        print(f"Active clients: {len(active)} hexagons, {total_active} people")

    # Extract terminated clients
    if 'terminated_clients' in layers:
        print("\nExtracting terminated clients...")
        terminated = extract_hexagons(html_content, layers['terminated_clients'], 'terminated_clients')
        all_hexagons.extend(terminated)
        total_terminated = sum(h['stats']['total'] for h in terminated)
        print(f"Terminated clients: {len(terminated)} hexagons, {total_terminated} people")

    if not all_hexagons:
        print("Warning: No hexagons found!")
        sys.exit(1)

    print(f"\nTotal: {len(all_hexagons)} hexagons")

    # Save to JSON
    output_data = {
        'source': str(input_file.name),
        'count': len(all_hexagons),
        'hexagons': all_hexagons
    }

    output_file.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Saved to {output_file}")


if __name__ == '__main__':
    main()
