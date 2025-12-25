-- Create apollo_clubs table for APOLLO NEXT fitness club locations
CREATE TABLE apollo_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT NOT NULL UNIQUE,     -- "019", "020", ...
  name TEXT NOT NULL,               -- "APOLLO NEXT 019"
  city TEXT NOT NULL,
  mall TEXT,                        -- ТРЦ/ТЦ название
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_apollo_clubs_city ON apollo_clubs(city);

-- Enable RLS
ALTER TABLE apollo_clubs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON apollo_clubs FOR SELECT
  USING (true);
