import { useState, useEffect } from 'react';
import { AuthProvider, UserMenu } from './components/Auth';
import { useAuthStore } from './stores/authStore';
import { useDataStore } from './stores/dataStore';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import FileUpload from './components/FileUpload';
import MapSelector from './components/MapSelector';
import { defaultMapData, defaultCenter, defaultZoom } from './utils/defaultData';
import { calculateCenter } from './utils/kmzParser';

const APP_VERSION = '2.11.0 (Axolotl)';

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
      />

      <div className="absolute top-4 left-4 z-[1000] max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">Map Circle Viewer</h1>
            <UserMenu />
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

          {/* POI Layers */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Інфраструктура</h3>

            {/* Metro */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMetro}
                  onChange={() => setShowMetro(!showMetro)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🚇 Метро Києва
                  <span className="flex gap-0.5 ml-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E4181C' }} title="М1 Червона"></span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0072BC' }} title="М2 Синя"></span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#009E49' }} title="М3 Зелена"></span>
                  </span>
                </span>
              </label>
              {showMetro && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={metroRadius}
                      onChange={(e) => setMetroRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setMetroRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${metroRadius === r ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metroOpacity}
                      onChange={(e) => setMetroOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{metroOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Malls */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMalls}
                  onChange={() => setShowMalls(!showMalls)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🏬 Торгові центри
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#9C27B0' }} title="ТЦ"></span>
                </span>
              </label>
              {showMalls && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={mallsRadius}
                      onChange={(e) => setMallsRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setMallsRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${mallsRadius === r ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mallsOpacity}
                      onChange={(e) => setMallsOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{mallsOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fitness */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFitness}
                  onChange={() => setShowFitness(!showFitness)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🏋️ Фітнес-клуби
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#4CAF50' }} title="Фітнес"></span>
                </span>
              </label>
              {showFitness && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={fitnessRadius}
                      onChange={(e) => setFitnessRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setFitnessRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${fitnessRadius === r ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fitnessOpacity}
                      onChange={(e) => setFitnessOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{fitnessOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Supermarkets */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSupermarkets}
                  onChange={() => setShowSupermarkets(!showSupermarkets)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🛒 Супермаркети
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#FF6B00' }} title="Супермаркети"></span>
                </span>
              </label>
              {showSupermarkets && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={supermarketsRadius}
                      onChange={(e) => setSupermarketsRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setSupermarketsRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${supermarketsRadius === r ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={supermarketsOpacity}
                      onChange={(e) => setSupermarketsOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{supermarketsOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Kyivstar Active Clients */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKyivstarActive}
                  onChange={() => setShowKyivstarActive(!showKyivstarActive)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🟢 Kyivstar: Діючі клієнти
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#22c55e' }} title="Active clients"></span>
                </span>
              </label>
              {showKyivstarActive && (
                <div className="mt-2 ml-6">
                  <div className="text-xs text-gray-500 mb-2">390 гексагонів, 9190 клієнтів</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={kyivstarActiveOpacity}
                      onChange={(e) => setKyivstarActiveOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{kyivstarActiveOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Kyivstar Terminated Clients */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKyivstarTerminated}
                  onChange={() => setShowKyivstarTerminated(!showKyivstarTerminated)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🔴 Kyivstar: Завершені клієнти
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#dc2626' }} title="Terminated clients"></span>
                </span>
              </label>
              {showKyivstarTerminated && (
                <div className="mt-2 ml-6">
                  <div className="text-xs text-gray-500 mb-2">878 гексагонів, 37605 клієнтів</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={kyivstarTerminatedOpacity}
                      onChange={(e) => setKyivstarTerminatedOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{kyivstarTerminatedOpacity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Apollo Next Clubs */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApolloClubs}
                  onChange={() => setShowApolloClubs(!showApolloClubs)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🏋️ APOLLO NEXT клуби
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#f97316' }} title="Apollo clubs"></span>
                </span>
              </label>
              {showApolloClubs && (
                <div className="mt-2 ml-6">
                  <div className="text-xs text-gray-500 mb-2">19 клубів у 6 містах</div>
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="100"
                      value={apolloClubsRadius}
                      onChange={(e) => setApolloClubsRadius(Math.min(2000, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setApolloClubsRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${apolloClubsRadius === r ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Яскравість:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={apolloClubsOpacity}
                      onChange={(e) => setApolloClubsOpacity(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-xs text-gray-600 w-8">{apolloClubsOpacity}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

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

          <div className="mt-4 pt-3 border-t text-xs text-gray-400 text-center">
            v{APP_VERSION} {mode === 'supabase' && '• Supabase'}
          </div>
        </div>
      </div>
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
