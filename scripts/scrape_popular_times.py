#!/usr/bin/env python3
"""
Scrape Google Popular Times data for Kyiv POIs.

This script scrapes popular times data from Google Maps for POIs
collected by collect_kyiv_pois.py.

WARNING: This scrapes Google and may violate their ToS.
Use responsibly and only for research purposes.

Usage:
    python scrape_popular_times.py [--batch-size 100] [--delay 1.5] [--resume]
"""

import json
import time
import argparse
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# Try importing populartimes
try:
    import populartimes
except ImportError:
    print("ERROR: populartimes not installed.")
    print("Install with: pip install git+https://github.com/m-wrzr/populartimes")
    exit(1)

# Google Places API key (optional, for place_id lookups)
GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'data'
INPUT_FILE = DATA_DIR / 'kyiv_pois.json'
OUTPUT_FILE = DATA_DIR / 'kyiv_popular_times.json'
PROGRESS_FILE = DATA_DIR / 'scrape_progress.json'


def load_pois() -> list:
    """Load POIs from JSON file."""
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['pois']


def load_progress() -> Dict[str, Any]:
    """Load scraping progress."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'processed': [],
        'failed': [],
        'results': [],
        'last_index': 0,
        'started_at': datetime.now().isoformat()
    }


def save_progress(progress: Dict[str, Any]):
    """Save scraping progress."""
    progress['updated_at'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def save_results(results: list):
    """Save final results."""
    output = {
        'metadata': {
            'scraped_at': datetime.now().isoformat(),
            'total_with_data': len([r for r in results if r.get('populartimes')]),
            'total_without_data': len([r for r in results if not r.get('populartimes')]),
            'total_count': len(results)
        },
        'pois': results
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)


def scrape_by_address(address: str, name: str) -> Optional[Dict[str, Any]]:
    """
    Scrape popular times data by address.

    This method doesn't use Google API, so it's free but less reliable.
    """
    try:
        # Construct search query
        query = f"{name}, {address}, Kyiv, Ukraine"

        # populartimes.get_id requires API key, so we use address-based search
        # This is a workaround - the library doesn't directly support address search
        # We'll need to use a different approach

        return None  # Placeholder - see alternative below

    except Exception as e:
        print(f"    Error: {e}")
        return None


def scrape_by_coordinates(lat: float, lng: float, name: str, poi_type: str) -> Optional[Dict[str, Any]]:
    """
    Scrape popular times by searching nearby places.

    Uses Google Places API to find place_id, then scrapes popular times.
    Requires GOOGLE_API_KEY.
    """
    if not GOOGLE_API_KEY:
        return None

    try:
        # Search for places near the coordinates with the given type
        results = populartimes.get(
            GOOGLE_API_KEY,
            [poi_type],  # Place types
            (lat - 0.0005, lng - 0.0005),  # SW corner
            (lat + 0.0005, lng + 0.0005),  # NE corner
            n_threads=1,
            all_places=False
        )

        # Find the best match by name
        if results:
            for result in results:
                if result.get('name', '').lower() in name.lower() or name.lower() in result.get('name', '').lower():
                    return {
                        'place_id': result.get('id'),
                        'name': result.get('name'),
                        'populartimes': result.get('populartimes'),
                        'time_spent': result.get('time_spent'),
                        'current_popularity': result.get('current_popularity'),
                        'rating': result.get('rating'),
                        'rating_n': result.get('rating_n'),
                    }

            # If no name match, return first result
            result = results[0]
            return {
                'place_id': result.get('id'),
                'name': result.get('name'),
                'populartimes': result.get('populartimes'),
                'time_spent': result.get('time_spent'),
                'current_popularity': result.get('current_popularity'),
                'rating': result.get('rating'),
                'rating_n': result.get('rating_n'),
            }

        return None

    except Exception as e:
        print(f"    API Error: {e}")
        return None


def generate_synthetic_populartimes(poi_type: str) -> list:
    """
    Generate synthetic popular times based on POI type.

    This is a fallback when real data isn't available.
    Uses typical patterns for different business types.
    """
    # Typical patterns by day of week (Mon=0, Sun=6)
    # Values are relative popularity (0-100)

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
        'default': {
            'weekday': [0, 0, 0, 0, 0, 0, 10, 30, 50, 60, 70, 70, 80, 70, 60, 70, 80, 90, 100, 80, 50, 30, 10, 0],
            'weekend': [0, 0, 0, 0, 0, 0, 5, 20, 40, 60, 80, 90, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0]
        }
    }

    pattern = patterns.get(poi_type, patterns['default'])

    # Generate 7 days (Mon-Sun)
    result = []
    for day_idx in range(7):
        is_weekend = day_idx >= 5
        day_pattern = pattern['weekend'] if is_weekend else pattern['weekday']

        day_data = {
            'name': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_idx],
            'data': day_pattern
        }
        result.append(day_data)

    return result


def main():
    parser = argparse.ArgumentParser(description='Scrape Popular Times for Kyiv POIs')
    parser.add_argument('--batch-size', type=int, default=100, help='Number of POIs per batch')
    parser.add_argument('--delay', type=float, default=1.5, help='Delay between requests in seconds')
    parser.add_argument('--resume', action='store_true', help='Resume from last progress')
    parser.add_argument('--synthetic', action='store_true', help='Use synthetic data (no scraping)')
    parser.add_argument('--limit', type=int, default=0, help='Limit number of POIs to process (0 = all)')
    args = parser.parse_args()

    print("=" * 60)
    print("Popular Times Scraper for Kyiv POIs")
    print("=" * 60)

    if not INPUT_FILE.exists():
        print(f"ERROR: Input file not found: {INPUT_FILE}")
        print("Run collect_kyiv_pois.py first!")
        return

    pois = load_pois()
    print(f"Loaded {len(pois)} POIs from {INPUT_FILE}")

    if args.limit:
        pois = pois[:args.limit]
        print(f"Limited to {len(pois)} POIs")

    if args.resume:
        progress = load_progress()
        processed_ids = set(progress['processed'])
        results = progress['results']
        print(f"Resuming from {len(processed_ids)} already processed POIs")
    else:
        processed_ids = set()
        results = []

    if args.synthetic:
        print("Using SYNTHETIC data (no real scraping)")
    elif GOOGLE_API_KEY:
        print(f"Google API key found: {GOOGLE_API_KEY[:10]}...")
    else:
        print("WARNING: No GOOGLE_API_KEY - will use synthetic data")
        args.synthetic = True

    print()
    start_time = time.time()
    processed_count = 0
    with_data_count = 0

    for idx, poi in enumerate(pois):
        osm_id = poi['osm_id']

        # Skip already processed
        if osm_id in processed_ids:
            continue

        processed_count += 1

        # Progress indicator
        if processed_count % 10 == 0:
            elapsed = time.time() - start_time
            rate = processed_count / elapsed if elapsed > 0 else 0
            remaining = (len(pois) - idx) / rate if rate > 0 else 0
            print(f"Progress: {idx + 1}/{len(pois)} ({(idx + 1) / len(pois) * 100:.1f}%) - "
                  f"Rate: {rate:.1f}/sec - ETA: {remaining / 60:.1f} min")

        # Get popular times data
        if args.synthetic:
            pop_times = generate_synthetic_populartimes(poi['poi_type'])
        else:
            # Try API-based scraping
            pop_times = None
            api_result = scrape_by_coordinates(
                poi['lat'], poi['lng'],
                poi['name'], poi['poi_type']
            )
            if api_result and api_result.get('populartimes'):
                pop_times = api_result['populartimes']
                with_data_count += 1

            if not pop_times:
                # Fallback to synthetic
                pop_times = generate_synthetic_populartimes(poi['poi_type'])

            time.sleep(args.delay)

        # Build result
        result = {
            **poi,
            'populartimes': pop_times,
            'is_synthetic': args.synthetic or not pop_times
        }
        results.append(result)
        processed_ids.add(osm_id)

        # Save progress periodically
        if processed_count % args.batch_size == 0:
            progress = {
                'processed': list(processed_ids),
                'failed': [],
                'results': results,
                'last_index': idx,
                'started_at': progress.get('started_at', datetime.now().isoformat()) if args.resume else datetime.now().isoformat()
            }
            save_progress(progress)
            print(f"  Saved progress: {len(results)} results")

    # Save final results
    save_results(results)
    save_progress({
        'processed': list(processed_ids),
        'failed': [],
        'results': results,
        'last_index': len(pois),
        'started_at': progress.get('started_at', datetime.now().isoformat()) if args.resume else datetime.now().isoformat(),
        'completed_at': datetime.now().isoformat()
    })

    elapsed = time.time() - start_time
    print()
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"  Total processed: {len(results)}")
    print(f"  With real data: {with_data_count}")
    print(f"  With synthetic data: {len(results) - with_data_count}")
    print(f"  Time elapsed: {elapsed / 60:.1f} minutes")
    print(f"  Output saved to: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
