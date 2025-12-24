-- Add polygons JSONB column to groups table
-- Version: 2.6.0
-- Date: 2025-12-24
-- Purpose: Store polygon coordinates from KML files

-- Add polygons column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS polygons JSONB DEFAULT '[]';

-- Add comment explaining the structure
COMMENT ON COLUMN groups.polygons IS 'Array of polygon objects: [{name: string, coordinates: [[lat, lng], ...], color?: string}]';
