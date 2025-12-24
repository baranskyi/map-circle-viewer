-- Seed Kyiv Metro stations
-- Source: OpenStreetMap Overpass API
-- Generated: 2025-12-06

-- Get layer and city IDs
DO $$
DECLARE
    metro_layer_id UUID;
    kyiv_city_id UUID;
BEGIN
    SELECT id INTO metro_layer_id FROM poi_layers WHERE name = 'Metro Stations' LIMIT 1;
    SELECT id INTO kyiv_city_id FROM cities WHERE name = 'Kyiv' LIMIT 1;

    -- Insert metro stations
    INSERT INTO poi_points (layer_id, city_id, name, name_uk, brand, lat, lng, source, source_id, metadata) VALUES
    (metro_layer_id, kyiv_city_id, 'Livoberezhna', 'Лівобережна', 'Kyiv Metro', 50.4518631, 30.5981679, 'OSM', '3803383803', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Hydropark', 'Гідропарк', 'Kyiv Metro', 50.445993, 30.5770339, 'OSM', '3803423898', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Darnytsia', 'Дарниця', 'Kyiv Metro', 50.4559397, 30.6128423, 'OSM', '3803601761', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Chernihivska', 'Чернігівська', 'Kyiv Metro', 50.4598903, 30.6303119, 'OSM', '3803615569', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Lisova', 'Лісова', 'Kyiv Metro', 50.4647597, 30.6459702, 'OSM', '3803636265', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Dnipro', 'Дніпро', 'Kyiv Metro', 50.4410407, 30.5586885, 'OSM', '3804139642', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Arsenalna', 'Арсенальна', 'Kyiv Metro', 50.4444878, 30.5454331, 'OSM', '3804612585', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Universytet', 'Університет', 'Kyiv Metro', 50.4442469, 30.5058928, 'OSM', '3806362030', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Vokzalna', 'Вокзальна', 'Kyiv Metro', 50.4416401, 30.4882512, 'OSM', '3806369598', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Politekhnichnyi Instytut', 'Політехнічний інститут', 'Kyiv Metro', 50.4507932, 30.466127, 'OSM', '3806396836', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Shuliavska', 'Шулявська', 'Kyiv Metro', 50.4550745, 30.4453703, 'OSM', '3806407690', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Beresteiska', 'Берестейська', 'Kyiv Metro', 50.4590925, 30.419688, 'OSM', '3806424761', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Nyvky', 'Нивки', 'Kyiv Metro', 50.4585958, 30.4042048, 'OSM', '3806440513', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Zhytomyrska', 'Житомирська', 'Kyiv Metro', 50.4561717, 30.3658729, 'OSM', '3806462121', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Akademmistechko', 'Академмістечко', 'Kyiv Metro', 50.4647043, 30.3550833, 'OSM', '3806504759', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Sviatoshyn', 'Святошин', 'Kyiv Metro', 50.4578249, 30.3908011, 'OSM', '10726245823', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Khreschatyk', 'Хрещатик', 'Kyiv Metro', 50.4471871, 30.5229456, 'OSM', '9151108492', '{"line": "M1", "line_name": "Святошинсько-Броварська", "line_color": "#E4181C", "wheelchair": "no"}'),
    -- M2 Blue Line (Obolonsko-Teremkivska)
    (metro_layer_id, kyiv_city_id, 'Heroiv Dnipra', 'Героїв Дніпра', 'Kyiv Metro', 50.5226701, 30.4988991, 'OSM', '5362526369', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Minska', 'Мінська', 'Kyiv Metro', 50.5121705, 30.4985738, 'OSM', '10726000863', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Obolon', 'Оболонь', 'Kyiv Metro', 50.5015331, 30.4982231, 'OSM', '5362524991', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Pochaina', 'Почайна', 'Kyiv Metro', 50.4861951, 30.4978905, 'OSM', '10726000864', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Tarasa Shevchenka', 'Тараса Шевченка', 'Kyiv Metro', 50.4735413, 30.5045395, 'OSM', '10726000865', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Kontraktova Ploshcha', 'Контрактова площа', 'Kyiv Metro', 50.4658354, 30.5150809, 'OSM', '7104807495', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Poshtova Ploshcha', 'Поштова площа', 'Kyiv Metro', 50.4587762, 30.5248945, 'OSM', '10726000866', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Independence Square', 'Майдан Незалежності', 'Kyiv Metro', 50.4499356, 30.5244408, 'OSM', '9151090552', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Ploshcha Ukrainskykh Heroiv', 'Площа Українських Героїв', 'Kyiv Metro', 50.4394165, 30.5166416, 'OSM', '7161002666', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Olimpiiska', 'Олімпійська', 'Kyiv Metro', 50.4322821, 30.5164035, 'OSM', '10726000867', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Palats Ukraina', 'Палац «Україна»', 'Kyiv Metro', 50.4206817, 30.5213092, 'OSM', '7247486081', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Lybidska', 'Либідська', 'Kyiv Metro', 50.4131113, 30.5248282, 'OSM', '10726000868', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Demiivska', 'Деміївська', 'Kyiv Metro', 50.4049317, 30.5169137, 'OSM', '10726000869', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Holosiivska', 'Голосіївська', 'Kyiv Metro', 50.3973294, 30.5081616, 'OSM', '10726000870', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Vasylkivska', 'Васильківська', 'Kyiv Metro', 50.3933354, 30.488223, 'OSM', '5267935777', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Vystavkovyi Tsentr', 'Виставковий центр', 'Kyiv Metro', 50.3824987, 30.4775836, 'OSM', '5267955453', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Ipodrom', 'Іподром', 'Kyiv Metro', 50.3765534, 30.4690454, 'OSM', '5267955454', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Teremky', 'Теремки', 'Kyiv Metro', 50.3669054, 30.4538209, 'OSM', '5267955455', '{"line": "M2", "line_name": "Оболонсько-Теремківська", "line_color": "#0072BC", "wheelchair": "yes"}'),
    -- M3 Green Line (Syretsko-Pecherska)
    (metro_layer_id, kyiv_city_id, 'Syrets', 'Сирець', 'Kyiv Metro', 50.4763888, 30.430831, 'OSM', '5267935781', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Dorohozhychi', 'Дорогожичі', 'Kyiv Metro', 50.4737337, 30.4487773, 'OSM', '5267955456', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Lukianivska', 'Лукʼянівська', 'Kyiv Metro', 50.4623623, 30.4818047, 'OSM', '10726245822', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Zoloti Vorota', 'Золоті ворота', 'Kyiv Metro', 50.4482462, 30.5134785, 'OSM', '7160992960', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Teatralna', 'Театральна', 'Kyiv Metro', 50.44521, 30.5180449, 'OSM', '7161002667', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Palats Sportu', 'Палац спорту', 'Kyiv Metro', 50.4382891, 30.5208694, 'OSM', '5267935778', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Klovska', 'Кловська', 'Kyiv Metro', 50.4369287, 30.5319209, 'OSM', '7218139984', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Pecherska', 'Печерська', 'Kyiv Metro', 50.4276251, 30.5389263, 'OSM', '10726245820', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Zvirynetska', 'Звіринецька', 'Kyiv Metro', 50.41825, 30.5450279, 'OSM', '10726245818', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Vydubychi', 'Видубичі', 'Kyiv Metro', 50.4020929, 30.560301, 'OSM', '10726245819', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Slavutych', 'Славутич', 'Kyiv Metro', 50.3942003, 30.6051576, 'OSM', '5267935779', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Osokorky', 'Осокорки', 'Kyiv Metro', 50.3951862, 30.6162493, 'OSM', '5267935780', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Pozniaky', 'Позняки', 'Kyiv Metro', 50.3978967, 30.6346619, 'OSM', '10726245817', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Kharkivska', 'Харківська', 'Kyiv Metro', 50.4006902, 30.6523061, 'OSM', '10726245816', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "no"}'),
    (metro_layer_id, kyiv_city_id, 'Vyrlytsia', 'Вирлиця', 'Kyiv Metro', 50.402895, 30.6661156, 'OSM', '10726245815', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Boryspilska', 'Бориспільська', 'Kyiv Metro', 50.403273, 30.6842649, 'OSM', '10726245814', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "yes"}'),
    (metro_layer_id, kyiv_city_id, 'Chervonyi Khutir', 'Червоний Хутір', 'Kyiv Metro', 50.4094593, 30.6961767, 'OSM', '5267955452', '{"line": "M3", "line_name": "Сирецько-Печерська", "line_color": "#009E49", "wheelchair": "yes"}')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Inserted Kyiv Metro stations';
END $$;
