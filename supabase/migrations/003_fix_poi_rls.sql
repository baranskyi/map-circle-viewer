-- Fix RLS policies for POI data - allow public read access
-- This allows metro stations to be displayed without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "POI layers are viewable by authenticated users" ON poi_layers;
DROP POLICY IF EXISTS "POI points are viewable by authenticated users" ON poi_points;
DROP POLICY IF EXISTS "Cities are viewable by authenticated users" ON cities;

-- Create new policies that allow public (anon) access for reading
CREATE POLICY "POI layers are publicly readable"
    ON poi_layers FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "POI points are publicly readable"
    ON poi_points FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Cities are publicly readable"
    ON cities FOR SELECT
    TO anon, authenticated
    USING (true);
