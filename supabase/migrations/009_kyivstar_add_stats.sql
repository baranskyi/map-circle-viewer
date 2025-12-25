-- Kyivstar hexagons: Add statistics and color columns
-- Version: 2.8.1
-- Date: 2025-12-25

-- Add new columns for statistics and styling
ALTER TABLE kyivstar_hexagons
ADD COLUMN IF NOT EXISTS fill_color TEXT DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS home_only INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS work_only INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS home_and_work INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_people INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gyms JSONB DEFAULT '[]'::jsonb;

-- Index for filtering by total people (for heatmap queries)
CREATE INDEX IF NOT EXISTS idx_kyivstar_hexagons_total ON kyivstar_hexagons(total_people);

-- Comments
COMMENT ON COLUMN kyivstar_hexagons.fill_color IS 'Original fill color from Kyivstar map';
COMMENT ON COLUMN kyivstar_hexagons.home_only IS 'People who live in this hexagon only';
COMMENT ON COLUMN kyivstar_hexagons.work_only IS 'People who work in this hexagon only';
COMMENT ON COLUMN kyivstar_hexagons.home_and_work IS 'People who both live and work in this hexagon';
COMMENT ON COLUMN kyivstar_hexagons.total_people IS 'Total number of people in this hexagon';
COMMENT ON COLUMN kyivstar_hexagons.gyms IS 'Distribution by gym locations';
