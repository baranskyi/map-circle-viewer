#!/usr/bin/env python3
"""
Geocode Apollo Next clubs using OpenStreetMap Nominatim API.
Usage: python scripts/geocode_apollo_clubs.py
Output: data/apollo_clubs.json
"""

import json
import time
import urllib.request
import urllib.parse
import os

# Apollo clubs data
CLUBS = [
    {"club_id": "019", "city": "Київ", "mall": "ТРЦ Дрімтаун-1", "address": "Оболонський проспект, 1Б"},
    {"club_id": "020", "city": "Київ", "mall": "ТРЦ Харьок", "address": "вулиця Декабристів, 9Е"},
    {"club_id": "021", "city": "Київ", "mall": "ТРЦ АренаСіті", "address": "вулиця Басейна, 1-3/2"},
    {"club_id": "022", "city": "Київ", "mall": "ТРЦ Алладін", "address": "вулиця Михайла Гришка, 3А"},
    {"club_id": "023", "city": "Київ", "mall": "ТРЦ Cosmo Multimall", "address": "вулиця Вадима Гетьмана, 6"},
    {"club_id": "024", "city": "Львів", "mall": "ТРЦ Victoria Gardens", "address": "вулиця Кульпарківська, 226А"},
    {"club_id": "025", "city": "Київ", "mall": "ТРЦ Ocean Plaza", "address": "вулиця Антоновича, 176"},
    {"club_id": "026", "city": "Київ", "mall": "ТРЦ Фестивальний", "address": "проспект Червоної Калини, 43/2"},
    {"club_id": "027", "city": "Бориспіль", "mall": "ЦУМ", "address": "вулиця Київський шлях, 14Ж"},
    {"club_id": "028", "city": "Київ", "mall": "ТЦ Уніцентр", "address": "Дарницька площа, 1"},
    {"club_id": "029", "city": "Київ", "mall": "ТЦ Ультрамарин", "address": "вулиця Василя Липківського, 1А"},
    {"club_id": "030", "city": "Київ", "mall": "ТЦ Магелан", "address": "проспект Академіка Глушкова, 13Б"},
    {"club_id": "031", "city": "Київ", "mall": "ТРЦ Сільпо", "address": "бульвар Миколи Руденка, 14М"},
    {"club_id": "032", "city": "Київ", "mall": "ТРЦ Сільпо", "address": "вулиця Самійла Кішки, 7"},
    {"club_id": "033", "city": "Вінниця", "mall": "ТРЦ Магігранд", "address": "вулиця Келецька, 78в"},
    {"club_id": "034", "city": "Львів", "mall": "БЦ Таурус", "address": "вулиця Героїв УПА, 73б"},
    {"club_id": "035", "city": "Біла Церква", "mall": "ТРЦ Гермес", "address": "вулиця Ярослава Мудрого, 40"},
    {"club_id": "036", "city": "Одеса", "mall": "ТЦ Сім'я", "address": "вулиця Семена Палія, 93А"},
    {"club_id": "037", "city": "Одеса", "mall": "ТЦ Острів", "address": "вулиця Новощіпний Ряд, 2"},
]

# Known coordinates for malls that are hard to geocode
KNOWN_COORDINATES = {
    "019": (50.5015, 30.4982),   # Дрімтаун-1, Obolon
    "020": (50.4562, 30.6150),   # ТРЦ Харьок
    "021": (50.4385, 30.5196),   # АренаСіті
    "022": (50.4147, 30.6202),   # Алладін
    "023": (50.4447, 30.4380),   # Cosmo Multimall
    "024": (49.7987, 23.9877),   # Victoria Gardens, Lviv
    "025": (50.4107, 30.5225),   # Ocean Plaza
    "026": (50.3972, 30.6410),   # Фестивальний
    "027": (50.3528, 30.9575),   # ЦУМ Бориспіль
    "028": (50.4148, 30.6672),   # Уніцентр
    "029": (50.4358, 30.4272),   # Ультрамарин
    "030": (50.3593, 30.4898),   # Магелан
    "031": (50.5193, 30.6032),   # Сільпо, Руденка
    "032": (50.4640, 30.5958),   # Сільпо, Кішки
    "033": (49.2175, 28.4078),   # Магігранд, Вінниця
    "034": (49.8303, 23.9960),   # БЦ Таурус, Львів
    "035": (49.7987, 30.1188),   # Гермес, Біла Церква
    "036": (46.4360, 30.7268),   # ТЦ Сім'я, Одеса
    "037": (46.4734, 30.7310),   # ТЦ Острів, Одеса
}

def geocode(address: str, city: str) -> tuple:
    """Geocode address using Nominatim API."""
    query = f"{address}, {city}, Україна"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"

    headers = {'User-Agent': 'ApolloNextMapViewer/1.0'}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"  Error geocoding: {e}")

    return None, None

def main():
    print("Geocoding Apollo Next clubs...")
    print("=" * 50)

    results = []

    for club in CLUBS:
        name = f"APOLLO NEXT {club['club_id']}"
        print(f"\n{name} ({club['city']})")
        print(f"  {club['mall']}, {club['address']}")

        # Use known coordinates
        if club['club_id'] in KNOWN_COORDINATES:
            lat, lng = KNOWN_COORDINATES[club['club_id']]
            print(f"  ✓ Using known coordinates: {lat}, {lng}")
        else:
            # Try geocoding
            lat, lng = geocode(club['address'], club['city'])
            if lat and lng:
                print(f"  ✓ Geocoded: {lat}, {lng}")
            else:
                print(f"  ✗ Failed to geocode")
                continue
            time.sleep(1.1)  # Nominatim rate limit

        results.append({
            "club_id": club['club_id'],
            "name": name,
            "city": club['city'],
            "mall": club['mall'],
            "address": club['address'],
            "lat": lat,
            "lng": lng
        })

    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)

    # Save results
    output_file = 'data/apollo_clubs.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({"clubs": results}, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"Done! {len(results)} clubs saved to {output_file}")

if __name__ == "__main__":
    main()
