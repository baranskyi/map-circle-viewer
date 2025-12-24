---
title: "Ukraine POI Data Sources Research Report"
created: 2025-12-06
modified: 2025-12-06
category: project
status: active
tags: [analytics, api, claude, dreams, finance, fitness, fozzy-group, nodejs]
related:
  - TZ
  - TZ-v2.0
  - todo4
  - todo2
  - todo3
---
# Ukraine POI Data Sources Research Report
**Generated:** 2025-12-06
**Target Cities:** Kyiv, Lviv, Kharkiv, Odesa, Dnipro

## Executive Summary

This report identifies reliable data sources for Points of Interest (POI) across four key categories in Ukraine: Shopping Malls, Fitness Clubs, Supermarket Chains, and Electronics Stores. The research covers both free and commercial APIs, official store locators, and database exports with geographic coordinates.

---

## 1. ТОРГОВЫЕ ЦЕНТРЫ (Shopping Malls)

### Primary Data Sources

#### **OpenStreetMap (OSM) - Ukraine POI Export** ⭐ RECOMMENDED
- **URL:** https://data.humdata.org/dataset/hotosm_ukr_points_of_interest
- **Coordinates:** ✅ Yes (lat/lng included)
- **API Available:** No (download only)
- **Formats:** Shapefile (SHP), GeoJSON
- **Data Quality:** High - Community-maintained, regularly updated
- **Last Updated:** 2 days ago (as of search date)
- **Coverage:** Includes features where `amenity IS NOT NULL`, `shop IS NOT NULL`, `tourism IS NOT NULL`
- **Extraction Method:** Download and filter by `shop=mall` or `amenity=marketplace`
- **Cost:** FREE

#### **Geofabrik - Ukraine OSM Extract**
- **URL:** https://download.geofabrik.de/europe/ukraine.html
- **Coordinates:** ✅ Yes
- **API Available:** No (download only)
- **Formats:** PBF (802 MB), Shapefile (1.6 GB)
- **Data Quality:** High - Full OSM data
- **Update Frequency:** Updated 9 hours ago
- **Extraction Method:** Download PBF/Shapefile, filter using Osmium/Osmosis
- **Cost:** FREE

#### **Malls.Rent - Ukraine Shopping Centers Catalog**
- **URL:** https://malls.rent/en/malls/cities-kyiv
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Data Quality:** Medium - Manual catalog
- **Coverage:** Kyiv, Rivne, Odessa
- **Extraction Method:** Web scraping + geocoding
- **Cost:** FREE (scraping)

#### **Wikipedia - List of Shopping Malls in Ukraine**
- **URL:** https://en.wikipedia.org/wiki/List_of_shopping_malls_in_Ukraine
- **Coordinates:** ❌ No (requires geocoding)
- **API Available:** No
- **Data Quality:** Medium - Static list, may be outdated
- **Extraction Method:** Manual scraping + geocoding
- **Cost:** FREE

### Notable Shopping Centers (for reference)
- **Kyiv:** Lavina Mall, Gulliver, Dream Town
- **Kharkiv:** Nikolsky Shopping Mall (opened May 21, 2021)
- **Lviv:** King Cross, Forum Lviv

### Recommended Approach
1. Download OSM POI export from Humanitarian Data Exchange
2. Filter by `shop=mall` OR `amenity=shopping_centre`
3. Validate against Malls.Rent catalog
4. Supplement missing data with manual geocoding

---

## 2. ФИТНЕС-КЛУБЫ (Fitness Clubs)

### **Sport Life** - Крупнейшая сеть фитнес-клубов ⭐

#### Official Store Locator
- **URL:** https://sportlife.ua/ru/clubs/
- **City-specific:** https://sportlife.ua/ru/clubs/kiev/ (Kyiv example)
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Network Size:** 50+ clubs in 15 cities
- **Coverage:** Kyiv, Lviv, Kharkiv, Odesa, Dnipro, Krivoy Rog, Cherkasy, Chernivtsi, Kremenchug, Lutsk, Zhytomyr, Rivne, Poltava, Bucha, Kamianets-Podilskyi
- **Extraction Method:** Web scraping from city pages + geocoding
- **Data Quality:** High - Official source
- **Cost:** FREE (scraping)

#### Sample Locations (confirmed)
- **Kyiv:** Lva Tolstoho St, 57 (BC 101 Tower)
- **Kyiv:** Dream Town shopping center, 3rd floor (2000 sq.m)
- **Kyiv:** IQ Business Center, Bolsunovskaya St, 13-15
- **Poltava:** Gogol St, 38

### **FitCurves** - Женская сеть фитнес-клубов ⭐

#### Official Store Locator
- **URL:** https://fitcurves.org/clubs/ (all Ukraine)
- **Kyiv:** https://fitcurves.org/ua/clubs/kiev/
- **Lviv:** https://fitcurves.org/ua/clubs/lvov/
- **Kharkiv:** https://fitcurves.org/ua/clubs/kharkov/
- **Coordinates:** ⚠️ Addresses + phone numbers (requires geocoding)
- **API Available:** No
- **Coverage:** Multiple clubs in Kyiv districts (Shevchenkivskyi, Holosiivskyi, Obolonskyi, Desnyanskyi, Darnytskyi, Dniprovskyi, Podilskyi, Solomyanskyi, Sviatoshynskyi), Lviv, Kharkiv
- **Extraction Method:** Web scraping + geocoding
- **Data Quality:** High - Official source with phone numbers
- **Cost:** FREE (scraping)

#### Sample Locations (confirmed)
**Kyiv:**
- Akademika Hlushkova St, 31-A - +38 (093) 605-15-88
- Oleksandra Myshyhy St, 3V - (096) 709 10 76
- Illienka St, 81-A

**Lviv:**
- Doroshenka St, 29 - 068 290 99 37
- Linkolna St, 6-B - (098) 906-73-79
- Liubinska St, 100 - (096) 526-29-96
- Chervonoi Kalyny Ave, 109 - (098) 553-14-99

**Kharkiv:**
- Poltavskyi Shliakh St, 123 - +38(095) 448-47-98
- Aerokosmichnyi Ave, 56 - +380(097) 056-86-25

### **Invictus, GYM 24, Fitness Life** - Not Found ❌
- No Ukrainian presence found for these brands
- Search results returned international chains (US, India)
- **Recommendation:** Focus on Sport Life and FitCurves for Ukraine

### **OpenStreetMap Alternative**
- Filter OSM data by `leisure=fitness_centre`
- Lower coverage than official websites but includes independent clubs
- **Recommended:** Use as supplementary source only

### Recommended Approach
1. Scrape Sport Life website for all 15 cities
2. Scrape FitCurves for Kyiv, Lviv, Kharkiv
3. Geocode addresses using Google Geocoding API or Nominatim (free)
4. Validate against OSM data for missing independent clubs

---

## 3. СІЛЬПО / НОВУС (Supermarket Chains)

### **Silpo (Сільпо)** - Fozzy Group ⭐

#### Official Store Locator
- **URL:** https://silpo.ua/stores
- **Coordinates:** ⚠️ Addresses + working hours (requires geocoding)
- **API Available:** No public API
- **Network Size:** 308 supermarkets in 60 cities (as of June 1, 2024)
- **Additional Format:** Le Silpo premium stores (4 locations)
- **Delivery:** Kyiv, Uzhhorod, Zaporizhzhia, Kherson, Zhytomyr
- **Mobile App:** shop.silpo.ua (online ordering, Click&Collect)
- **Extraction Method:** Web scraping + geocoding
- **Data Quality:** High - Official source with operating hours
- **Cost:** FREE (scraping)

#### Third-party Aggregators
- **Locator.ua:** https://locator.ua/kyiv/supermarket/silpo-supermarket/en/
- Provides addresses, phones, working hours by district
- Useful for validation

### **Novus** ⭐

#### Official Store Locator
- **URL:** https://novus.zakaz.ua/en/ (online store with delivery)
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Mobile App:** Available on Google Play
- **Extraction Method:** Web scraping from Locator.ua + geocoding
- **Data Quality:** Medium - No official locator found
- **Cost:** FREE (scraping)

#### Third-party Aggregators
- **Locator.ua:** https://locator.ua/kyiv/supermarket/supermarket-novus/en/
- Provides detailed addresses by city

#### Sample Locations (confirmed)
**Kyiv:**
- Ioana Pavla II St
- Romana Shukhevycha Ave
- Yevropeyskoho Soyuzu Ave
- Brovarsky Ave, 17
- Lvivska St, 17
- Akademika Palladina, 7 (near metro Academmistechko)

**Brovary:** Kyivska St, 253

### **ATB-Market** (for reference)

- **Network Size:** 1,224 stores in 117 cities, 15 regions
- **Founded:** 1993 (Dnipro)
- **Market Position:** Largest discount retail chain in Ukraine
- **Joint Map:** https://bit.ly/3HycQhV (includes ATB, Silpo, Novus, Varus, Rukavychka, ECO-market)
- **Note:** This joint map was created in collaboration with Ministry of Digital Transformation (March 2022)

### Recommended Approach
1. Scrape Silpo official website (silpo.ua/stores)
2. Use Locator.ua for Novus addresses
3. Geocode all addresses using batch geocoding service
4. Validate against joint grocery map
5. Consider partnership inquiry with Fozzy Group for API access

---

## 4. БЫТОВАЯ ТЕХНИКА (Electronics Stores)

### **Foxtrot** ⭐

#### Official Store Locator
- **URL:** https://www.foxtrot.com.ua/uk/stores
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Network Size:** 120 stores in 67 cities + 3 delivery points
- **Founded:** 1994 (Kharkiv)
- **Total Area:** 207,000+ sq.m
- **Employees:** ~8,000
- **Special Features:** Member of Euronics (international association)
- **Payment:** VisaQR, LiqPay, Apple Pay, Google Pay, cryptocurrency
- **Extraction Method:** Web scraping + geocoding
- **Data Quality:** High - Official source
- **Cost:** FREE (scraping)

#### Contact
- Phone: 0 800 300-353
- Email: info@foxtrot.com.ua
- Headquarters: Dorohozhytska St, 1, Kyiv, 04119

#### Sample Locations (Kyiv)
- Hetmana St, 6 (TRC Cosmopolit)
- Stepana Bandery Ave, 23 (TRC Gorodok Gallery)
- Zdolbunivska St, 17 (TC Rive Gauche)
- Hnata Khotkevycha St, 1-V (TRK Prospekt)

### **Comfy (Комфі)** ⭐

#### Official Store Locator
- **URL:** https://comfy.ua/ua/shops.html
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Network Size:** 113-115 stores (as of September 2025)
- **Customer Base:** 11.5+ million customers
- **Product Range:** 200,000 items
- **Channels:** Offline stores, online (comfy.ua), mobile app, call center
- **Extraction Method:** Web scraping + geocoding
- **Data Quality:** High - Official source
- **Cost:** FREE (scraping)

#### Contact
- Phone: 0800 303505
- Headquarters: Slavy Blvd, 6B, Dnipro, 49100

#### Sample Locations
- **Lviv:** Vyhovskoho St, 100, floor 2
- **Kyiv:** Blockbuster Mall, Stepana Bandery Ave
- **Kyiv:** Piramida Mall, O. Myshuhy St, 4
- **Khodosivka:** MegaMarket TC, Dniprovske Hwy, 1

### **MOYO** ⭐

#### Official Store Locator
- **URL:** https://www.moyo.ua/ua/trade_network.html
- **Coordinates:** ⚠️ Addresses only (requires geocoding)
- **API Available:** No
- **Network Size:** 70-90+ stores in 40+ cities
- **Founded:** 2009
- **Special Feature:** 24/7 stores in Kyiv and Lviv (only in Ukraine)
- **Channels:** Offline stores, online, mobile app
- **Extraction Method:** Web scraping + interactive map on website
- **Data Quality:** High - Official source with map
- **Cost:** FREE (scraping)

#### Contact
- Phone: 0-800-507-800
- Headquarters: Bohdana Khmelnytskoho St, 44, Kyiv, 01030

#### Sample Locations
**Kyiv:**
- TC "Klever" (near metro Kharkivska)
- Near metro Darnitsa (50-100m from exit)
- Near metro Livoberezhna (5 min walk)

**Lviv:**
- TC "Arsen" (buses 7, 8, 13, 17, 22, 31, 34, 50, 51, 55, 111)
- City center near Adam Mickiewicz monument
- 24/7 warehouse store

**Zhytomyr:**
- TRC "Global UA" (parking from Mykhaila Hrushevskoho St)

### **Eldorado** (Limited presence)
- **URL:** No official locator found
- **Network Size:** Small presence (few locations)
- **Sample Locations:**
  - Kyiv: Vyzvolyteliv Ave, 17
  - Kyiv: Gulliver shopping center
  - Rivne: Hetmana Sahaidachnoho St, 2
- **Recommendation:** Low priority - limited network

### Recommended Approach
1. Scrape official store locators for Foxtrot, Comfy, MOYO
2. Batch geocode all addresses
3. Validate against shopping mall locations (electronics stores often in malls)
4. Cross-reference with OSM data (`shop=electronics`)

---

## Alternative Data Sources & APIs

### **OpenStreetMap Overpass API** (Free) ⭐ RECOMMENDED

#### Description
- Real-time query API for OpenStreetMap data
- Filter by tags (amenity, shop, leisure, etc.)
- Returns GeoJSON with coordinates

#### Setup
- **Web Interface:** https://overpass-turbo.eu/
- **API Endpoint:** https://overpass-api.de/api/interpreter
- **Cost:** FREE (with rate limits)
- **Coordinates:** ✅ Yes
- **Documentation:** https://wiki.openstreetmap.org/wiki/Overpass_API

#### Example Query (Fitness Centers in Kyiv)
```
[out:json];
area["name"="Київ"]["admin_level"=4];
(
  node["leisure"="fitness_centre"](area);
  way["leisure"="fitness_centre"](area);
  relation["leisure"="fitness_centre"](area);
);
out center;
```

#### Pros
- Real-time data
- Free with no API key
- Precise coordinates
- Flexible queries

#### Cons
- Data completeness varies by region
- May miss some brand locations
- Requires OSM community updates

### **Geoapify Places API** (Commercial)

- **URL:** https://www.geoapify.com/points-of-interest-data/
- **Coordinates:** ✅ Yes
- **API Available:** ✅ Yes (RESTful API)
- **Data Source:** OpenStreetMap-based
- **Categories:** 500+ place categories
- **Pricing:** Pay-per-request (cheaper than Google)
- **License:** Permissive
- **Coverage:** Ukraine supported
- **Pros:** Easier than raw OSM, structured API
- **Cons:** Costs money, OSM data limitations

### **HERE Geocoding & Search API** (Commercial)

- **URL:** https://www.here.com/platform/geocoding
- **Coordinates:** ✅ Yes
- **API Available:** ✅ Yes
- **POI Database:** 120+ million POIs in 100+ countries
- **Search:** Name, address, coordinates, phone, category, brand
- **Coverage:** Ukraine supported
- **Pricing:** Cheaper than Google Places (varies)
- **Pros:** Large commercial database, brand search
- **Cons:** Costs money, may require contract

### **Google Places API** (Commercial - Expensive)

- **URL:** https://developers.google.com/maps/documentation/places/web-service/overview
- **Coordinates:** ✅ Yes
- **API Available:** ✅ Yes
- **Coverage:** Excellent for Ukraine
- **Pricing:** $0.020 per Place Details request ($20 per 1,000)
- **Pros:** Most complete data, active businesses
- **Cons:** EXPENSIVE, vendor lock-in

### **SimpleMaps - Ukraine Cities Database**

- **URL:** https://simplemaps.com/data/ua-cities
- **Coordinates:** ✅ Yes (221 cities)
- **API Available:** No (CSV/JSON download)
- **License:** MIT
- **Formats:** CSV, Excel, JSON
- **Data:** City lat/lng, province, population
- **Use Case:** Geocoding city names to coordinates
- **Cost:** FREE

### **Back4App - Ukraine Cities Database**

- **URL:** https://www.back4app.com/database/back4app/list-of-cities-in-ukraine
- **Coordinates:** ✅ Yes
- **API Available:** ✅ Yes (API playground)
- **Data:** Detailed city information
- **Use Case:** City-level geocoding
- **Cost:** FREE tier available

### **GPS-Data-Team POI Files**

- **URL:** https://www.gps-data-team.com/poi/ukraine/
- **Coordinates:** ✅ Yes
- **API Available:** No (download)
- **Categories:** Accommodation, Automotive, Petrol, Shopping, etc.
- **Formats:** GPS device formats
- **Cost:** Varies (check website)

---

## Data Extraction Strategy & Recommendations

### Phase 1: Free Data Collection (Recommended First)

#### **Shopping Malls**
1. Download OSM POI export from Humanitarian Data Exchange
2. Filter by `shop=mall` OR `amenity=shopping_centre`
3. Cross-validate with Wikipedia list
4. Manual additions from Malls.Rent

**Estimated Coverage:** 80-90%
**Cost:** FREE
**Time:** 2-4 hours

#### **Fitness Clubs**
1. Scrape Sport Life website (https://sportlife.ua/ru/clubs/)
   - Parse all city pages
   - Extract addresses, phones, club types
2. Scrape FitCurves (https://fitcurves.org/clubs/)
   - Parse Kyiv, Lviv, Kharkiv pages
   - Extract addresses and phones
3. Batch geocode using Nominatim (free) or Google Geocoding API
4. Supplement with OSM `leisure=fitness_centre` filter

**Estimated Coverage:** 70-80% (mainly Sport Life + FitCurves)
**Cost:** FREE (or minimal for geocoding)
**Time:** 4-6 hours

#### **Supermarkets (Silpo/Novus)**
1. Scrape Silpo (https://silpo.ua/stores)
   - Extract addresses, working hours
2. Scrape Locator.ua for Novus addresses
3. Batch geocode addresses
4. Validate against joint grocery map

**Estimated Coverage:** 85-95%
**Cost:** FREE (or minimal for geocoding)
**Time:** 3-5 hours

#### **Electronics Stores**
1. Scrape Foxtrot (https://www.foxtrot.com.ua/uk/stores)
2. Scrape Comfy (https://comfy.ua/ua/shops.html)
3. Scrape MOYO (https://www.moyo.ua/ua/trade_network.html)
4. Batch geocode addresses
5. Validate against shopping mall locations

**Estimated Coverage:** 90-95%
**Cost:** FREE (or minimal for geocoding)
**Time:** 4-6 hours

### Phase 2: API Integration (Optional Enhancement)

#### **Overpass API (OpenStreetMap)**
- Real-time POI queries
- Supplement scraped data with independent locations
- Free but requires learning Overpass QL

**Use Case:** Fill gaps, find independent businesses
**Cost:** FREE
**Setup Time:** 2-3 hours to learn API

#### **Commercial APIs (if budget allows)**
- **Geoapify:** Best value for OSM-based data
- **HERE:** Best for brand/chain search
- **Google Places:** Most complete but expensive

**Use Case:** Production-grade data, real-time updates
**Cost:** Varies ($50-500/month depending on volume)

### Phase 3: Data Maintenance

#### **Update Frequency Recommendations**
- **Shopping Malls:** Quarterly (new malls are rare)
- **Fitness Clubs:** Monthly (new locations, closures)
- **Supermarkets:** Monthly (active expansion)
- **Electronics:** Monthly (store openings/closings)

#### **Validation Methods**
1. Cross-reference with Google Maps
2. Phone verification (call to confirm)
3. Community reports (if public-facing app)
4. OSM changeset monitoring

---

## Technical Implementation

### Geocoding Options

#### **Free Options**
1. **Nominatim (OSM)** - https://nominatim.org/
   - Limit: 1 request/second
   - No API key required
   - Good for Ukraine addresses
   - Best for: Low-volume batch processing

2. **Geoapify Free Tier** - https://www.geoapify.com/
   - 3,000 requests/day free
   - API key required
   - Better rate limits than Nominatim
   - Best for: Medium-volume projects

#### **Paid Options**
1. **Google Geocoding API**
   - $5 per 1,000 requests
   - Most accurate for Ukraine
   - Best for: Production applications

2. **HERE Geocoding API**
   - Cheaper than Google
   - Good accuracy
   - Best for: Cost-conscious production

### Web Scraping Tools

#### **Recommended Libraries**
- **Python:** BeautifulSoup4, Scrapy, Selenium (for JavaScript-heavy sites)
- **Node.js:** Puppeteer, Cheerio

#### **Legal Considerations**
- Check robots.txt
- Respect rate limits
- Use ethical scraping practices
- Consider API access requests to companies

### Data Storage

#### **Recommended Format**
```json
{
  "id": "unique_id",
  "name": "Store Name",
  "brand": "Silpo",
  "category": "supermarket",
  "address": "Street, 123, Kyiv",
  "city": "Kyiv",
  "coordinates": {
    "lat": 50.4501,
    "lng": 30.5234
  },
  "phone": "+380441234567",
  "working_hours": "08:00-22:00",
  "source": "silpo.ua",
  "last_updated": "2025-12-06"
}
```

#### **Database Options**
- **PostgreSQL + PostGIS:** Best for geospatial queries
- **MongoDB:** Flexible schema, good for rapid development
- **SQLite + SpatiaLite:** Lightweight, good for prototypes

---

## Cost Estimates

### Scenario 1: Fully Free (DIY Scraping + OSM)
- **Data Collection:** 0 USD
- **Geocoding:** 0 USD (Nominatim)
- **Time Investment:** 15-20 hours
- **Data Quality:** 75-85%
- **Total Cost:** 0 USD + developer time

### Scenario 2: Hybrid (Scraping + Paid Geocoding)
- **Data Collection:** 0 USD (web scraping)
- **Geocoding:** ~50-100 USD (Google Geocoding, ~10,000 addresses)
- **Time Investment:** 12-15 hours
- **Data Quality:** 85-95%
- **Total Cost:** 50-100 USD + developer time

### Scenario 3: Commercial API
- **Geoapify Places API:** ~100-200 USD/month (based on query volume)
- **HERE Places API:** ~150-300 USD/month
- **Google Places API:** ~500-1000 USD/month (expensive)
- **Time Investment:** 5-8 hours (integration)
- **Data Quality:** 90-98%
- **Total Cost:** 100-1000 USD/month ongoing

---

## Final Recommendations

### For Immediate Start (Budget: $0)
1. **Week 1:** Download OSM POI data, scrape Sport Life + FitCurves
2. **Week 2:** Scrape Silpo, Novus, Foxtrot, Comfy, MOYO
3. **Week 3:** Batch geocode using Nominatim, validate data
4. **Week 4:** Build database, test API integration

**Estimated Total Time:** 40-60 hours
**Estimated Total Cost:** $0
**Data Coverage:** 75-85%

### For Production Quality (Budget: $200-500)
1. **Phase 1:** Same as free approach (2 weeks)
2. **Phase 2:** Use Google Geocoding API for accurate coordinates
3. **Phase 3:** Set up Overpass API for real-time OSM updates
4. **Phase 4:** Implement monthly data refresh automation

**Estimated Total Time:** 60-80 hours
**Estimated Total Cost:** $200-500 one-time
**Data Coverage:** 90-95%

### For Enterprise Solution (Budget: $500+/month)
1. **Subscribe to HERE or Geoapify Places API**
2. **Supplement with official scraping for brand-specific data**
3. **Set up automated daily/weekly updates**
4. **Implement data quality monitoring**

**Estimated Total Time:** 80-100 hours initial setup
**Estimated Total Cost:** $500-1000/month ongoing
**Data Coverage:** 95-98%

---

## Data Quality Assessment

### Category-by-Category Quality

| Category | Official Sources | OSM Coverage | Recommended Approach | Estimated Accuracy |
|----------|-----------------|--------------|---------------------|-------------------|
| Shopping Malls | Medium | High | OSM + Manual | 85-90% |
| Fitness Clubs | High (Sport Life, FitCurves) | Medium | Scraping + OSM | 70-80% |
| Supermarkets | High (Silpo official) | High | Scraping + OSM | 85-95% |
| Electronics | High (3 official sites) | Medium | Scraping + validation | 90-95% |

### Known Gaps
- **Independent fitness clubs:** Not covered by Sport Life/FitCurves
- **Small local malls:** May not be in OSM
- **New store openings:** 1-3 month lag in OSM
- **Temporary closures:** Not reflected in scraped data

### Mitigation Strategies
1. **Combine multiple sources** (OSM + official websites)
2. **Implement user feedback** (if public-facing)
3. **Set up automated monitoring** for official websites
4. **Monthly validation runs** against Google Maps

---

## Sources & References

### Official Store Locators
- [Silpo Official Store List](https://silpo.ua/stores)
- [Sport Life Clubs](https://sportlife.ua/ru/clubs/)
- [FitCurves Ukraine](https://fitcurves.org/clubs/)
- [Foxtrot Stores](https://www.foxtrot.com.ua/uk/stores)
- [Comfy Stores](https://comfy.ua/ua/shops.html)
- [MOYO Trade Network](https://www.moyo.ua/ua/trade_network.html)

### OpenStreetMap Data
- [Ukraine POI Export (HDX)](https://data.humdata.org/dataset/hotosm_ukr_points_of_interest)
- [Geofabrik Ukraine Download](https://download.geofabrik.de/europe/ukraine.html)
- [Overpass Turbo](https://overpass-turbo.eu/)

### Commercial APIs
- [Geoapify Places API](https://www.geoapify.com/points-of-interest-data/)
- [HERE Geocoding & Search](https://www.here.com/platform/geocoding)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)

### Third-Party Aggregators
- [Locator.ua](https://locator.ua/)
- [Malls.Rent](https://malls.rent/en/malls/cities-kyiv)
- [Wikipedia - Shopping Malls Ukraine](https://en.wikipedia.org/wiki/List_of_shopping_malls_in_Ukraine)

### Geographic Data
- [SimpleMaps Ukraine Cities](https://simplemaps.com/data/ua-cities)
- [Back4App Ukraine Database](https://www.back4app.com/database/back4app/list-of-cities-in-ukraine)
- [GPS-Data-Team POI Files](https://www.gps-data-team.com/poi/ukraine/)

---

## Next Steps

1. **Decide on budget and timeline**
2. **Choose extraction approach** (free vs paid)
3. **Set up development environment** (Python/Node.js)
4. **Start with pilot category** (recommend Supermarkets - easiest)
5. **Build data pipeline** (scraping → geocoding → validation → storage)
6. **Test with sample city** (Kyiv recommended)
7. **Scale to all cities**
8. **Implement monitoring and updates**

---

**Report Generated By:** Claude Code via Happy
**Date:** 2025-12-06
**Last Updated:** 2025-12-06
