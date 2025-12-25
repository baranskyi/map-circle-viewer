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
import PixelLogo from './components/PixelLogo';
import MascotGallery from './components/MascotGallery';
import { defaultMapData, defaultCenter, defaultZoom } from './utils/defaultData';
import { calculateCenter } from './utils/kmzParser';

// VERSION NAMING RULES:
// - Animal name changes only on MINOR version bump (2.12.x -> 2.13.0)
// - Patch versions keep the same animal (2.12.1, 2.12.2, 2.12.3 = same animal)
// - Each minor version gets a unique meme animal mascot
const APP_VERSION = '2.15.3 (Puffin)';

function MapApp() {
  const { user } = useAuthStore();
  const { currentMap, groups, fetchMap, fetchMaps, createGroup, createPoint, updateGroup, deleteGroup, loading } = useDataStore();

  // Local state for KMZ data (when not using Supabase)
  const [localMapData, setLocalMapData] = useState(defaultMapData);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);

  // Group settings: visibility, radius, color
  const [groupSettings, setGroupSettings] = useState({});

  // POI Layer visibility
  const [showMetro, setShowMetro] = useState(true);
  const [showMalls, setShowMalls] = useState(false);
  const [showFitness, setShowFitness] = useState(false);
  const [showSupermarkets, setShowSupermarkets] = useState(false);
  const [showKyivstarActive, setShowKyivstarActive] = useState(false);
  const [showKyivstarTerminated, setShowKyivstarTerminated] = useState(false);
  const [showApolloClubs, setShowApolloClubs] = useState(false);

  // POI Layer radius settings (in meters)
  const [metroRadius, setMetroRadius] = useState(500);
  const [mallsRadius, setMallsRadius] = useState(1000);
  const [fitnessRadius, setFitnessRadius] = useState(500);
  const [supermarketsRadius, setSupermarketsRadius] = useState(500);
  const [apolloClubsRadius, setApolloClubsRadius] = useState(500);

  // POI Layer opacity settings (0-100%)
  const [metroOpacity, setMetroOpacity] = useState(50);
  const [mallsOpacity, setMallsOpacity] = useState(50);
  const [fitnessOpacity, setFitnessOpacity] = useState(50);
  const [supermarketsOpacity, setSupermarketsOpacity] = useState(50);
  const [kyivstarActiveOpacity, setKyivstarActiveOpacity] = useState(100);
  const [kyivstarTerminatedOpacity, setKyivstarTerminatedOpacity] = useState(100);
  const [apolloClubsOpacity, setApolloClubsOpacity] = useState(50);

  // Mode: 'local' (KMZ files) or 'supabase' (saved maps)
  const [mode, setMode] = useState('local');

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

  // Get active groups based on mode
  const activeGroups = mode === 'supabase' && currentMap ? groups : localMapData.groups;

  // Initialize group settings when groups change
  useEffect(() => {
    const settings = {};
    activeGroups.forEach(group => {
      settings[group.id] = {
        visible: false,
        polygonsVisible: true,
        labelsVisible: true,
        radius: group.default_radius || group.defaultRadius || 1000,
        color: group.color || group.defaultColor || '#FF5252',
        iconType: 'circle'
      };
    });
    setGroupSettings(settings);
  }, [activeGroups]);

  // Handle map selection from MapSelector
  const handleMapSelect = async (mapId) => {
    const map = await fetchMap(mapId);
    if (map) {
      setMode('supabase');
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

  // Reset to default data
  const resetToDefault = () => {
    setLocalMapData(defaultMapData);
    setMode('local');
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  // Toggle all groups visibility
  const toggleAllGroups = (visible) => {
    setGroupSettings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(groupId => {
        updated[groupId] = {
          ...updated[groupId],
          visible
        };
      });
      return updated;
    });
  };

  // Transform groups for MapView (normalize structure)
  const normalizedGroups = activeGroups.map(group => ({
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
        showSupermarkets={showSupermarkets}
        showKyivstarActive={showKyivstarActive}
        showKyivstarTerminated={showKyivstarTerminated}
        showApolloClubs={showApolloClubs}
        metroRadius={metroRadius}
        mallsRadius={mallsRadius}
        fitnessRadius={fitnessRadius}
        supermarketsRadius={supermarketsRadius}
        apolloClubsRadius={apolloClubsRadius}
        metroOpacity={metroOpacity / 100 * 0.3}
        mallsOpacity={mallsOpacity / 100 * 0.3}
        fitnessOpacity={fitnessOpacity / 100 * 0.3}
        supermarketsOpacity={supermarketsOpacity / 100 * 0.3}
        kyivstarActiveOpacity={kyivstarActiveOpacity / 100}
        kyivstarTerminatedOpacity={kyivstarTerminatedOpacity / 100}
        apolloClubsOpacity={apolloClubsOpacity / 100 * 0.3}
        onVisiblePointsChange={setVisiblePoints}
        highlightedPointId={highlightedPointId}
        onMapReady={(map) => { mapRef.current = map; }}
        leftPanelCollapsed={isLeftPanelCollapsed}
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
        <div className="absolute top-[90px] left-3 z-[1001]">
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
      <div className="absolute top-[90px] left-3 z-[1001] max-h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PixelLogo size={28} />
              <h1 className="text-base font-bold">Map Circle Viewer</h1>
            </div>
            <div className="flex items-center gap-1">
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
          </div>

          {/* Map Selector (for authenticated users) */}
          {user && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              {/* Show map list only when no map selected */}
              {!(currentMap && mode === 'supabase') && (
                <MapSelector onMapSelect={handleMapSelect} />
              )}

              {/* Selected Map Content */}
              {currentMap && mode === 'supabase' && (
                <div>
                  {/* Map Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-blue-800 text-lg">{currentMap.name}</h3>
                    <button
                      onClick={() => {
                        setMode('local');
                        useDataStore.getState().setCurrentMap(null);
                      }}
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
                    groups={normalizedGroups}
                    groupSettings={groupSettings}
                    onToggle={toggleGroup}
                    onTogglePolygons={togglePolygons}
                    onToggleLabels={toggleLabels}
                    onRadiusChange={updateRadius}
                    onColorChange={updateColor}
                    onIconChange={updateIcon}
                    onToggleAll={toggleAllGroups}
                  />
                </div>
              )}
            </div>
          )}

          {/* File Upload for local/non-auth mode */}
          {(!user || mode === 'local') && !(currentMap && mode === 'supabase') && (
            <FileUpload
              onDataLoaded={handleDataLoaded}
              onReset={resetToDefault}
              onMapCreated={handleMapCreated}
              currentMapId={null}
              onDataAddedToMap={handleDataAddedToMap}
            />
          )}

          {/* Loading indicator for local mode */}
          {loading && mode === 'local' && (
            <div className="text-center py-2 text-gray-400 text-sm">
              Завантаження...
            </div>
          )}

          {/* Draggable Infrastructure Layers */}
          <DraggableInfrastructure
            showMetro={showMetro} setShowMetro={setShowMetro}
            showMalls={showMalls} setShowMalls={setShowMalls}
            showFitness={showFitness} setShowFitness={setShowFitness}
            showSupermarkets={showSupermarkets} setShowSupermarkets={setShowSupermarkets}
            showKyivstarActive={showKyivstarActive} setShowKyivstarActive={setShowKyivstarActive}
            showKyivstarTerminated={showKyivstarTerminated} setShowKyivstarTerminated={setShowKyivstarTerminated}
            showApolloClubs={showApolloClubs} setShowApolloClubs={setShowApolloClubs}
            metroRadius={metroRadius} setMetroRadius={setMetroRadius}
            mallsRadius={mallsRadius} setMallsRadius={setMallsRadius}
            fitnessRadius={fitnessRadius} setFitnessRadius={setFitnessRadius}
            supermarketsRadius={supermarketsRadius} setSupermarketsRadius={setSupermarketsRadius}
            apolloClubsRadius={apolloClubsRadius} setApolloClubsRadius={setApolloClubsRadius}
            metroOpacity={metroOpacity} setMetroOpacity={setMetroOpacity}
            mallsOpacity={mallsOpacity} setMallsOpacity={setMallsOpacity}
            fitnessOpacity={fitnessOpacity} setFitnessOpacity={setFitnessOpacity}
            supermarketsOpacity={supermarketsOpacity} setSupermarketsOpacity={setSupermarketsOpacity}
            kyivstarActiveOpacity={kyivstarActiveOpacity} setKyivstarActiveOpacity={setKyivstarActiveOpacity}
            kyivstarTerminatedOpacity={kyivstarTerminatedOpacity} setKyivstarTerminatedOpacity={setKyivstarTerminatedOpacity}
            apolloClubsOpacity={apolloClubsOpacity} setApolloClubsOpacity={setApolloClubsOpacity}
          />

          {/* Control Panel - only for local mode (not when Supabase map selected) */}
          {!(currentMap && mode === 'supabase') && (
            <ControlPanel
              groups={normalizedGroups}
              groupSettings={groupSettings}
              onToggle={toggleGroup}
              onTogglePolygons={togglePolygons}
              onToggleLabels={toggleLabels}
              onRadiusChange={updateRadius}
              onColorChange={updateColor}
              onIconChange={updateIcon}
              onToggleAll={toggleAllGroups}
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
