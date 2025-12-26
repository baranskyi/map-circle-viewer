import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, UserMenu } from './components/Auth';
import { useAuthStore } from './stores/authStore';
import { useDataStore } from './stores/dataStore';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import FileUpload from './components/FileUpload';
import MapSelector from './components/MapSelector';
import DraggableInfrastructure from './components/DraggableInfrastructure';
import VersionMascot from './components/VersionMascot';
import VisiblePointsPanel from './components/VisiblePointsPanel';
import MascotGallery from './components/MascotGallery';
import { defaultMapData, defaultCenter, defaultZoom } from './utils/defaultData';
import { calculateCenter } from './utils/kmzParser';

// VERSION NAMING RULES:
// - Animal name changes only on MINOR version bump (2.12.x -> 2.13.0)
// - Patch versions keep the same animal (2.12.1, 2.12.2, 2.12.3 = same animal)
// - Each minor version gets a unique meme animal mascot
const APP_VERSION = '2.17.8 (Fennec)';

function MapApp() {
  const { user } = useAuthStore();
  const { currentMap, groups, fetchMap, fetchMaps, createGroup, createPoint, updateGroup, deleteGroup, loading } = useDataStore();

  // Local state for KMZ data (when not using Supabase)
  const [localMapData, setLocalMapData] = useState(defaultMapData);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);

  // All loaded groups from all maps (accumulated)
  const [allLoadedGroups, setAllLoadedGroups] = useState([]);

  // Group settings: visibility, radius, color
  const [groupSettings, setGroupSettings] = useState({});

  // POI Layer visibility
  const [showMetro, setShowMetro] = useState(true);
  const [showMalls, setShowMalls] = useState(false);
  const [showFitness, setShowFitness] = useState(false);
  const [showKyivstarActive, setShowKyivstarActive] = useState(false);
  const [showKyivstarTerminated, setShowKyivstarTerminated] = useState(false);

  // POI Layer radius settings (in meters)
  const [metroRadius, setMetroRadius] = useState(500);
  const [mallsRadius, setMallsRadius] = useState(1000);
  const [fitnessRadius, setFitnessRadius] = useState(500);

  // POI Layer opacity settings (0-100%)
  const [metroOpacity, setMetroOpacity] = useState(50);
  const [mallsOpacity, setMallsOpacity] = useState(50);
  const [fitnessOpacity, setFitnessOpacity] = useState(50);
  const [kyivstarActiveOpacity, setKyivstarActiveOpacity] = useState(100);
  const [kyivstarTerminatedOpacity, setKyivstarTerminatedOpacity] = useState(100);

  // Heatmap settings
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapDay, setHeatmapDay] = useState(0);
  const [heatmapHour, setHeatmapHour] = useState(12);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);
  const [heatmapCity, setHeatmapCity] = useState('all');

  // Mode: 'local' (KMZ files) or 'supabase' (saved maps)
  const [mode, setMode] = useState('local');

  // Flag to show map list vs selected map content (preserves groups when going back)
  const [showingMapList, setShowingMapList] = useState(true);

  // Visible points panel state
  const [visiblePoints, setVisiblePoints] = useState([]);
  const [highlightedPointId, setHighlightedPointId] = useState(null);
  const mapRef = useRef(null);

  // Left panel collapse state
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Mascot gallery modal state
  const [isMascotGalleryOpen, setIsMascotGalleryOpen] = useState(false);

  // Handle point click from panel - center map on point
  const handlePointClick = useCallback((point) => {
    if (mapRef.current) {
      mapRef.current.setView([point.lat, point.lng], 16, { animate: true });
    }
  }, []);

  // Get active groups for current map view (UI panel)
  const activeGroups = mode === 'supabase' && currentMap ? groups : localMapData.groups;

  // Accumulate groups from loaded maps
  useEffect(() => {
    if (mode === 'supabase' && currentMap && groups.length > 0) {
      setAllLoadedGroups(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        const newGroups = groups
          .filter(g => !existingIds.has(g.id))
          .map(g => ({ ...g, mapId: currentMap.id, mapName: currentMap.name }));
        return [...prev, ...newGroups];
      });
    }
  }, [mode, currentMap, groups]);

  // Initialize group settings when groups change - preserve ALL existing settings
  useEffect(() => {
    const groupsToInit = mode === 'supabase' ? allLoadedGroups : localMapData.groups;
    setGroupSettings(prev => {
      const settings = { ...prev }; // Keep ALL previous settings (across all maps)
      groupsToInit.forEach(group => {
        // Only add settings for NEW groups, preserve existing
        if (!settings[group.id]) {
          settings[group.id] = {
            visible: false,
            polygonsVisible: true,
            labelsVisible: true,
            radius: group.default_radius || group.defaultRadius || 1000,
            color: group.color || group.defaultColor || '#FF5252',
            iconType: 'circle',
            opacity: 50
          };
        }
      });
      return settings;
    });
  }, [allLoadedGroups, localMapData.groups, mode]);

  // Handle map selection from MapSelector
  const handleMapSelect = async (mapId) => {
    const map = await fetchMap(mapId);
    if (map) {
      setMode('supabase');
      setShowingMapList(false);
      // Center on first point if exists
      const allPoints = map.groups?.flatMap(g => g.points || []) || [];
      if (allPoints.length > 0) {
        const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
        const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
        setCenter([avgLat, avgLng]);
        setZoom(12);
      }
    }
  };

  // Handle new KMZ data loaded (for non-authenticated users)
  const handleDataLoaded = (newData) => {
    setLocalMapData(newData);
    setMode('local');
    const newCenter = calculateCenter(newData.groups);
    setCenter(newCenter);
    setZoom(12);
  };

  // Handle new map created from KMZ upload (for authenticated users)
  const handleMapCreated = async (mapId) => {
    // Refresh maps list
    await fetchMaps();
    // Select the newly created map
    await handleMapSelect(mapId);
  };

  // Handle data added to existing map
  const handleDataAddedToMap = async (mapId) => {
    // Re-fetch the current map to get updated groups/points
    await fetchMap(mapId);
  };

  // Toggle group visibility
  const toggleGroup = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        visible: !prev[groupId].visible
      }
    }));
  };

  // Toggle polygons visibility
  const togglePolygons = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        polygonsVisible: !prev[groupId].polygonsVisible
      }
    }));
  };

  // Toggle labels visibility
  const toggleLabels = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        labelsVisible: !prev[groupId].labelsVisible
      }
    }));
  };

  // Update group radius
  const updateRadius = (groupId, radius) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        radius: parseInt(radius, 10)
      }
    }));
  };

  // Update group color
  const updateColor = (groupId, color) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        color
      }
    }));
  };

  // Update group icon type
  const updateIcon = (groupId, iconType) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        iconType
      }
    }));
  };

  // Update group opacity
  const updateOpacity = (groupId, opacity) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        opacity
      }
    }));
  };

  // Reset to default data
  const resetToDefault = () => {
    setLocalMapData(defaultMapData);
    setMode('local');
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  // Toggle all groups visibility (optionally only for specific groups)
  const toggleAllGroups = (visible, targetGroups = null) => {
    setGroupSettings(prev => {
      const updated = { ...prev };
      const groupIds = targetGroups
        ? targetGroups.map(g => g.id)
        : Object.keys(updated);
      groupIds.forEach(groupId => {
        if (updated[groupId]) {
          updated[groupId] = {
            ...updated[groupId],
            visible
          };
        }
      });
      return updated;
    });
  };

  // All groups to display on map (from all loaded maps)
  const allGroupsForMap = mode === 'supabase' ? allLoadedGroups : localMapData.groups;

  // Transform groups for MapView (normalize structure)
  const normalizedGroups = allGroupsForMap.map(group => ({
    ...group,
    id: group.id,
    name: group.name,
    mapName: group.mapName || '',
    defaultRadius: group.default_radius || group.defaultRadius || 1000,
    defaultColor: group.color || group.defaultColor || '#FF5252',
    points: (group.points || []).map(point => ({
      ...point,
      lat: point.lat,
      lng: point.lng,
      name: point.name
    })),
    polygons: group.polygons || []
  }));

  // Groups for current map's control panel (only current map)
  const currentMapGroups = activeGroups.map(group => ({
    ...group,
    id: group.id,
    name: group.name,
    defaultRadius: group.default_radius || group.defaultRadius || 1000,
    defaultColor: group.color || group.defaultColor || '#FF5252',
    points: (group.points || []).map(point => ({
      ...point,
      lat: point.lat,
      lng: point.lng,
      name: point.name
    })),
    polygons: group.polygons || []
  }));

  return (
    <div className="h-screen w-screen relative">
      <MapView
        groups={normalizedGroups}
        groupSettings={groupSettings}
        center={center}
        zoom={zoom}
        showMetro={showMetro}
        showMalls={showMalls}
        showFitness={showFitness}
        showKyivstarActive={showKyivstarActive}
        showKyivstarTerminated={showKyivstarTerminated}
        metroRadius={metroRadius}
        mallsRadius={mallsRadius}
        fitnessRadius={fitnessRadius}
        metroOpacity={metroOpacity / 100 * 0.3}
        mallsOpacity={mallsOpacity / 100 * 0.3}
        fitnessOpacity={fitnessOpacity / 100 * 0.3}
        kyivstarActiveOpacity={kyivstarActiveOpacity / 100}
        kyivstarTerminatedOpacity={kyivstarTerminatedOpacity / 100}
        onVisiblePointsChange={setVisiblePoints}
        highlightedPointId={highlightedPointId}
        onMapReady={(map) => { mapRef.current = map; }}
        leftPanelCollapsed={isLeftPanelCollapsed}
        showHeatmap={showHeatmap}
        heatmapDay={heatmapDay}
        heatmapHour={heatmapHour}
        heatmapOpacity={heatmapOpacity}
        heatmapCity={heatmapCity}
      />

      {/* Visible Points Panel */}
      <VisiblePointsPanel
        points={visiblePoints}
        onPointHover={setHighlightedPointId}
        onPointClick={handlePointClick}
        hoveredPointId={highlightedPointId}
      />

      {/* Left Panel - Collapsed */}
      {isLeftPanelCollapsed && (
        <div className="absolute top-4 left-4 z-[1001]">
          <button
            onClick={() => setIsLeftPanelCollapsed(false)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            title="Показати панель"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Left Panel - Expanded */}
      {!isLeftPanelCollapsed && (
      <div className="absolute top-4 left-4 z-[1001] max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <UserMenu />
            <button
              onClick={() => setIsLeftPanelCollapsed(true)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors"
              title="Згорнути панель"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Map Selector (for authenticated users) */}
          {user && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              {/* Show map list when showingMapList is true */}
              {showingMapList && (
                <MapSelector
                  onMapSelect={handleMapSelect}
                  allLoadedGroups={allLoadedGroups}
                  groupSettings={groupSettings}
                />
              )}

              {/* Selected Map Content */}
              {!showingMapList && currentMap && mode === 'supabase' && (
                <div>
                  {/* Map Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-blue-800 text-lg">{currentMap.name}</h3>
                    <button
                      onClick={() => setShowingMapList(true)}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      ← Назад до списку
                    </button>
                  </div>

                  {/* Upload to this map */}
                  <div className="mb-3 pb-3 border-b border-blue-200">
                    <FileUpload
                      onDataLoaded={handleDataLoaded}
                      onReset={resetToDefault}
                      onMapCreated={handleMapCreated}
                      currentMapId={currentMap.id}
                      onDataAddedToMap={handleDataAddedToMap}
                    />
                  </div>

                  {/* Loading indicator */}
                  {loading && (
                    <div className="text-center py-2 text-gray-400 text-sm">
                      Завантаження...
                    </div>
                  )}

                  {/* Groups in this map */}
                  <ControlPanel
                    groups={currentMapGroups}
                    groupSettings={groupSettings}
                    onToggle={toggleGroup}
                    onTogglePolygons={togglePolygons}
                    onToggleLabels={toggleLabels}
                    onRadiusChange={updateRadius}
                    onColorChange={updateColor}
                    onIconChange={updateIcon}
                    onOpacityChange={updateOpacity}
                    onToggleAll={(visible) => toggleAllGroups(visible, currentMapGroups)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Draggable Infrastructure Layers */}
          <DraggableInfrastructure
            showMetro={showMetro} setShowMetro={setShowMetro}
            showMalls={showMalls} setShowMalls={setShowMalls}
            showFitness={showFitness} setShowFitness={setShowFitness}
            showKyivstarActive={showKyivstarActive} setShowKyivstarActive={setShowKyivstarActive}
            showKyivstarTerminated={showKyivstarTerminated} setShowKyivstarTerminated={setShowKyivstarTerminated}
            metroRadius={metroRadius} setMetroRadius={setMetroRadius}
            mallsRadius={mallsRadius} setMallsRadius={setMallsRadius}
            fitnessRadius={fitnessRadius} setFitnessRadius={setFitnessRadius}
            metroOpacity={metroOpacity} setMetroOpacity={setMetroOpacity}
            mallsOpacity={mallsOpacity} setMallsOpacity={setMallsOpacity}
            fitnessOpacity={fitnessOpacity} setFitnessOpacity={setFitnessOpacity}
            kyivstarActiveOpacity={kyivstarActiveOpacity} setKyivstarActiveOpacity={setKyivstarActiveOpacity}
            kyivstarTerminatedOpacity={kyivstarTerminatedOpacity} setKyivstarTerminatedOpacity={setKyivstarTerminatedOpacity}
            showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
            heatmapDay={heatmapDay} setHeatmapDay={setHeatmapDay}
            heatmapHour={heatmapHour} setHeatmapHour={setHeatmapHour}
            heatmapOpacity={heatmapOpacity} setHeatmapOpacity={setHeatmapOpacity}
            heatmapCity={heatmapCity} setHeatmapCity={setHeatmapCity}
          />

          {/* Control Panel - only for local mode (not when Supabase map selected) */}
          {!(currentMap && mode === 'supabase') && (
            <ControlPanel
              groups={currentMapGroups}
              groupSettings={groupSettings}
              onToggle={toggleGroup}
              onTogglePolygons={togglePolygons}
              onToggleLabels={toggleLabels}
              onRadiusChange={updateRadius}
              onColorChange={updateColor}
              onIconChange={updateIcon}
              onOpacityChange={updateOpacity}
              onToggleAll={(visible) => toggleAllGroups(visible, currentMapGroups)}
            />
          )}

          <div className="mt-4 pt-3 border-t text-center">
            <div className="text-xs text-gray-400">
              v{APP_VERSION} {mode === 'supabase' && '• Supabase'}
            </div>
            <div
              onClick={() => setIsMascotGalleryOpen(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Переглянути всіх маскотів"
            >
              <VersionMascot version={APP_VERSION} />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mascot Gallery Modal */}
      <MascotGallery
        isOpen={isMascotGalleryOpen}
        onClose={() => setIsMascotGalleryOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MapApp />
    </AuthProvider>
  );
}

export default App;
