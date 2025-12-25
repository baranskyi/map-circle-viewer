-- Kyivstar Customer Hexagons Layer
-- Version: 2.8.0
-- Date: 2025-12-25
-- Description: Stores hexagon polygons from Kyivstar showing customer distribution zones

-- ============================================
-- TABLE: kyivstar_hexagons
-- ============================================

CREATE TABLE kyivstar_hexagons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hex_id TEXT NOT NULL,
    coordinates JSONB NOT NULL,  -- Array of [lat, lng] coordinate pairs
    layer_name TEXT DEFAULT 'active_clients',
    source_file TEXT,            -- Original HTML file name for tracking updates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_kyivstar_hexagons_layer ON kyivstar_hexagons(layer_name);
CREATE INDEX idx_kyivstar_hexagons_hex_id ON kyivstar_hexagons(hex_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE kyivstar_hexagons ENABLE ROW LEVEL SECURITY;

-- Everyone can read hexagons (public infrastructure data)
CREATE POLICY "Anyone can read kyivstar hexagons"
    ON kyivstar_hexagons FOR SELECT
    USING (true);

-- Only authenticated users can insert/update (for admin purposes)
CREATE POLICY "Authenticated users can insert kyivstar hexagons"
    ON kyivstar_hexagons FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update kyivstar hexagons"
    ON kyivstar_hexagons FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete kyivstar hexagons"
    ON kyivstar_hexagons FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE kyivstar_hexagons IS 'Hexagon polygons from Kyivstar showing customer distribution zones';
COMMENT ON COLUMN kyivstar_hexagons.hex_id IS 'Original hexagon ID from Kyivstar data';
COMMENT ON COLUMN kyivstar_hexagons.coordinates IS 'Array of [lat, lng] coordinate pairs forming the hexagon polygon';
COMMENT ON COLUMN kyivstar_hexagons.layer_name IS 'Layer classification (e.g., active_clients, potential_clients)';
COMMENT ON COLUMN kyivstar_hexagons.source_file IS 'Name of the source HTML file for update tracking';
