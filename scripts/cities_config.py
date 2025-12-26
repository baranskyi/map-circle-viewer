"""
Configuration for Ukrainian cities for heatmap generation.
Each city has:
- name: Display name
- name_en: English name for filenames
- center: (lat, lng) coordinates
- bbox: Bounding box for Overpass API queries (south, west, north, east)
"""

CITIES = {
    'kyiv': {
        'name': 'Київ',
        'name_en': 'kyiv',
        'center': (50.4501, 30.5234),
        'bbox': (50.21, 30.23, 50.59, 30.83),  # Large city
    },
    'odesa': {
        'name': 'Одеса',
        'name_en': 'odesa',
        'center': (46.4825, 30.7233),
        'bbox': (46.35, 30.60, 46.60, 30.85),
    },
    'lviv': {
        'name': 'Львів',
        'name_en': 'lviv',
        'center': (49.8397, 24.0297),
        'bbox': (49.77, 23.90, 49.92, 24.15),
    },
    'vinnytsia': {
        'name': 'Вінниця',
        'name_en': 'vinnytsia',
        'center': (49.2331, 28.4682),
        'bbox': (49.17, 28.38, 49.29, 28.56),
    },
    'bila_tserkva': {
        'name': 'Біла Церква',
        'name_en': 'bila_tserkva',
        'center': (49.7988, 30.1188),
        'bbox': (49.75, 30.05, 49.85, 30.19),
    },
    'boryspil': {
        'name': 'Бориспіль',
        'name_en': 'boryspil',
        'center': (50.3522, 30.9542),
        'bbox': (50.32, 30.90, 50.39, 31.02),
    },
    'ternopil': {
        'name': 'Тернопіль',
        'name_en': 'ternopil',
        'center': (49.5535, 25.5948),
        'bbox': (49.50, 25.52, 49.60, 25.68),
    },
}

# List of all cities for batch processing
ALL_CITIES = list(CITIES.keys())

# Default city
DEFAULT_CITY = 'kyiv'
