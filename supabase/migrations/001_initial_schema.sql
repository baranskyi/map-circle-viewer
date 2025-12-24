-- Map Circle Viewer - Initial Database Schema
-- Version: 1.0.0
-- Date: 2025-12-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Cities table (reference data)
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uk TEXT, -- Ukrainian name
    country TEXT NOT NULL DEFAULT 'Ukraine',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maps (workspaces)
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    shared_link TEXT UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map access control
CREATE TABLE map_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(map_id, user_id)
);

-- Groups (brands/categories)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#FF5252',
    default_radius INTEGER NOT NULL DEFAULT 1000,
    type TEXT NOT NULL DEFAULT 'brand' CHECK (type IN ('brand', 'category', 'poi')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points (locations)
CREATE TABLE points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id),
    name TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN (
        'our_club',        -- Наш клуб (действующий)
        'in_development',  -- В разработке
        'we_rejected',     -- Мы отказали
        'they_rejected',   -- Отказали нам
        'competitor',      -- Конкурент
        'under_review'     -- На рассмотрении
    )),
    google_maps_link TEXT,
    phone TEXT,
    website TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Comments on points
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    point_id UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POI Layers (infrastructure data)
CREATE TABLE poi_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uk TEXT,
    type TEXT NOT NULL CHECK (type IN ('mall', 'metro', 'supermarket', 'electronics', 'fitness', 'other')),
    icon TEXT,
    color TEXT DEFAULT '#666666',
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POI Points (infrastructure points - separate from user points)
CREATE TABLE poi_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES poi_layers(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id),
    name TEXT NOT NULL,
    name_uk TEXT,
    brand TEXT,
    address TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone TEXT,
    website TEXT,
    working_hours TEXT,
    metadata JSONB DEFAULT '{}',
    source TEXT, -- OSM, scraper, manual
    source_id TEXT, -- Original ID from source
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geocoding cache
CREATE TABLE geocoding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    city TEXT,
    display_name TEXT,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_maps_user_id ON maps(user_id);
CREATE INDEX idx_map_access_map_id ON map_access(map_id);
CREATE INDEX idx_map_access_user_id ON map_access(user_id);
CREATE INDEX idx_groups_map_id ON groups(map_id);
CREATE INDEX idx_points_group_id ON points(group_id);
CREATE INDEX idx_points_city_id ON points(city_id);
CREATE INDEX idx_points_status ON points(status);
CREATE INDEX idx_points_location ON points USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
CREATE INDEX idx_comments_point_id ON comments(point_id);
CREATE INDEX idx_poi_points_layer_id ON poi_points(layer_id);
CREATE INDEX idx_poi_points_city_id ON poi_points(city_id);
CREATE INDEX idx_poi_points_brand ON poi_points(brand);
CREATE INDEX idx_poi_points_location ON poi_points USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
CREATE INDEX idx_geocoding_cache_address ON geocoding_cache(address);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_points ENABLE ROW LEVEL SECURITY;

-- Cities: readable by all authenticated users
CREATE POLICY "Cities are viewable by authenticated users"
    ON cities FOR SELECT
    TO authenticated
    USING (true);

-- POI Layers: readable by all authenticated users
CREATE POLICY "POI layers are viewable by authenticated users"
    ON poi_layers FOR SELECT
    TO authenticated
    USING (true);

-- POI Points: readable by all authenticated users
CREATE POLICY "POI points are viewable by authenticated users"
    ON poi_points FOR SELECT
    TO authenticated
    USING (true);

-- Maps: users can see maps they have access to
CREATE POLICY "Users can view their own maps"
    ON maps FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        id IN (SELECT map_id FROM map_access WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own maps"
    ON maps FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own maps"
    ON maps FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own maps"
    ON maps FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Map Access: viewable by map owner and users with access
CREATE POLICY "Map access viewable by participants"
    ON map_access FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        map_id IN (SELECT id FROM maps WHERE user_id = auth.uid())
    );

CREATE POLICY "Map owner can manage access"
    ON map_access FOR ALL
    TO authenticated
    USING (
        map_id IN (SELECT id FROM maps WHERE user_id = auth.uid())
    );

-- Groups: accessible based on map access
CREATE POLICY "Groups viewable by map participants"
    ON groups FOR SELECT
    TO authenticated
    USING (
        map_id IN (
            SELECT id FROM maps WHERE user_id = auth.uid()
            UNION
            SELECT map_id FROM map_access WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Groups editable by map owner and editors"
    ON groups FOR INSERT
    TO authenticated
    WITH CHECK (
        map_id IN (
            SELECT id FROM maps WHERE user_id = auth.uid()
            UNION
            SELECT map_id FROM map_access WHERE user_id = auth.uid() AND access_level IN ('owner', 'editor')
        )
    );

CREATE POLICY "Groups updatable by map owner and editors"
    ON groups FOR UPDATE
    TO authenticated
    USING (
        map_id IN (
            SELECT id FROM maps WHERE user_id = auth.uid()
            UNION
            SELECT map_id FROM map_access WHERE user_id = auth.uid() AND access_level IN ('owner', 'editor')
        )
    );

CREATE POLICY "Groups deletable by map owner"
    ON groups FOR DELETE
    TO authenticated
    USING (
        map_id IN (SELECT id FROM maps WHERE user_id = auth.uid())
    );

-- Points: accessible based on group's map access
CREATE POLICY "Points viewable by map participants"
    ON points FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT g.id FROM groups g
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid()
        )
    );

CREATE POLICY "Points editable by map owner and editors"
    ON points FOR INSERT
    TO authenticated
    WITH CHECK (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT g.id FROM groups g
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid() AND ma.access_level IN ('owner', 'editor')
        )
    );

CREATE POLICY "Points updatable by map owner and editors"
    ON points FOR UPDATE
    TO authenticated
    USING (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT g.id FROM groups g
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid() AND ma.access_level IN ('owner', 'editor')
        )
    );

CREATE POLICY "Points deletable by map owner and editors"
    ON points FOR DELETE
    TO authenticated
    USING (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT g.id FROM groups g
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid() AND ma.access_level IN ('owner', 'editor')
        )
    );

-- Comments: accessible based on point's map access
CREATE POLICY "Comments viewable by map participants"
    ON comments FOR SELECT
    TO authenticated
    USING (
        point_id IN (
            SELECT p.id FROM points p
            JOIN groups g ON p.group_id = g.id
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT p.id FROM points p
            JOIN groups g ON p.group_id = g.id
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid()
        )
    );

CREATE POLICY "Comments insertable by map owner and editors"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        point_id IN (
            SELECT p.id FROM points p
            JOIN groups g ON p.group_id = g.id
            JOIN maps m ON g.map_id = m.id
            WHERE m.user_id = auth.uid()
            UNION
            SELECT p.id FROM points p
            JOIN groups g ON p.group_id = g.id
            JOIN map_access ma ON g.map_id = ma.map_id
            WHERE ma.user_id = auth.uid() AND ma.access_level IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_maps_updated_at
    BEFORE UPDATE ON maps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_updated_at
    BEFORE UPDATE ON points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create map_access entry for map owner
CREATE OR REPLACE FUNCTION create_owner_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO map_access (map_id, user_id, access_level)
    VALUES (NEW.id, NEW.user_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_map_owner_access
    AFTER INSERT ON maps
    FOR EACH ROW
    EXECUTE FUNCTION create_owner_access();

-- Function to generate Google Maps link
CREATE OR REPLACE FUNCTION generate_google_maps_link(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TEXT AS $$
BEGIN
    RETURN 'https://www.google.com/maps?q=' || lat || ',' || lng;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Ukrainian Cities
-- ============================================

INSERT INTO cities (name, name_uk, country, lat, lng) VALUES
    ('Kyiv', 'Київ', 'Ukraine', 50.4501, 30.5234),
    ('Lviv', 'Львів', 'Ukraine', 49.8397, 24.0297),
    ('Kharkiv', 'Харків', 'Ukraine', 49.9935, 36.2304),
    ('Odesa', 'Одеса', 'Ukraine', 46.4825, 30.7233),
    ('Dnipro', 'Дніпро', 'Ukraine', 48.4647, 35.0462),
    ('Zaporizhzhia', 'Запоріжжя', 'Ukraine', 47.8388, 35.1396),
    ('Vinnytsia', 'Вінниця', 'Ukraine', 49.2331, 28.4682),
    ('Poltava', 'Полтава', 'Ukraine', 49.5883, 34.5514),
    ('Chernihiv', 'Чернігів', 'Ukraine', 51.4982, 31.2893),
    ('Cherkasy', 'Черкаси', 'Ukraine', 49.4285, 32.0621),
    ('Zhytomyr', 'Житомир', 'Ukraine', 50.2547, 28.6587),
    ('Sumy', 'Суми', 'Ukraine', 50.9077, 34.7981),
    ('Rivne', 'Рівне', 'Ukraine', 50.6199, 26.2516),
    ('Ivano-Frankivsk', 'Івано-Франківськ', 'Ukraine', 48.9226, 24.7111),
    ('Ternopil', 'Тернопіль', 'Ukraine', 49.5535, 25.5948),
    ('Lutsk', 'Луцьк', 'Ukraine', 50.7472, 25.3254),
    ('Khmelnytskyi', 'Хмельницький', 'Ukraine', 49.4229, 26.9871),
    ('Uzhhorod', 'Ужгород', 'Ukraine', 48.6208, 22.2879),
    ('Chernivtsi', 'Чернівці', 'Ukraine', 48.2920, 25.9358),
    ('Kropyvnytskyi', 'Кропивницький', 'Ukraine', 48.5079, 32.2623)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: POI Layers
-- ============================================

INSERT INTO poi_layers (name, name_uk, type, icon, color) VALUES
    ('Shopping Malls', 'Торгові центри', 'mall', 'shopping-cart', '#9C27B0'),
    ('Metro Stations', 'Станції метро', 'metro', 'train', '#2196F3'),
    ('Silpo', 'Сільпо', 'supermarket', 'store', '#FF9800'),
    ('Novus', 'Новус', 'supermarket', 'store', '#4CAF50'),
    ('Foxtrot', 'Фокстрот', 'electronics', 'laptop', '#F44336'),
    ('Comfy', 'Комфі', 'electronics', 'laptop', '#E91E63'),
    ('MOYO', 'MOYO', 'electronics', 'laptop', '#00BCD4'),
    ('Sport Life', 'Sport Life', 'fitness', 'dumbbell', '#FF5722'),
    ('FitCurves', 'FitCurves', 'fitness', 'dumbbell', '#8BC34A')
ON CONFLICT DO NOTHING;
