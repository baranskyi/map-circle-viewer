import { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import InfoTooltip from './InfoTooltip';

export default function MapSelector({ onMapSelect, allLoadedGroups = [], groupSettings = {} }) {
  const { user } = useAuthStore();
  const { maps, loading, error, fetchMaps, createMap, deleteMap } = useDataStore();

  // Calculate which maps have visible points
  const getMapActiveStatus = (mapId) => {
    const mapGroups = allLoadedGroups.filter(g => g.mapId === mapId);
    const activeGroups = mapGroups.filter(g => groupSettings[g.id]?.visible);
    const visiblePointsCount = activeGroups.reduce((sum, g) => sum + (g.points?.length || 0), 0);
    const totalPointsCount = mapGroups.reduce((sum, g) => sum + (g.points?.length || 0), 0);
    return {
      hasGroups: mapGroups.length > 0,
      activeGroups: activeGroups.length,
      totalGroups: mapGroups.length,
      visiblePoints: visiblePointsCount,
      totalPoints: totalPointsCount
    };
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name } or null

  useEffect(() => {
    if (user) {
      fetchMaps();
    }
  }, [user, fetchMaps]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMapName.trim()) return;

    const newMap = await createMap({
      name: newMapName.trim(),
      description: newMapDescription.trim()
    });

    if (newMap) {
      setShowCreateModal(false);
      setNewMapName('');
      setNewMapDescription('');
      onMapSelect(newMap.id);
    }
  };

  const handleDeleteClick = (map, e) => {
    e.stopPropagation();
    setDeleteConfirm({ id: map.id, name: map.name });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMap(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-gray-500">
        Увійдіть, щоб переглянути ваші карти
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700">Мої карти</h3>
          <InfoTooltip
            text="Тут розташовуються ваші експорти з Google Maps, на яких ви можете наносити точки та зони неправильні об'єкти для аналізу."
            position="bottom"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVideoModal(true)}
            className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
          >
            Інструкція
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            + Нова
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-2 text-gray-400">Завантаження...</div>
      )}

      {error && (
        <div className="text-center py-2 text-red-500 text-sm">{error}</div>
      )}

      {!loading && maps.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          У вас ще немає карт
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {maps.map(map => {
          const status = getMapActiveStatus(map.id);
          const isActive = status.visiblePoints > 0;

          return (
            <div
              key={map.id}
              onClick={() => onMapSelect(map.id)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer group transition-colors ${
                isActive
                  ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Active indicator */}
                {status.hasGroups && (
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={isActive
                      ? `${status.visiblePoints}/${status.totalPoints} точок відображено`
                      : 'Немає активних точок'
                    }
                  />
                )}
                <div className="min-w-0">
                  <div className={`font-medium text-sm truncate ${isActive ? 'text-green-800' : ''}`}>
                    {map.name}
                  </div>
                  {map.description && (
                    <div className="text-xs text-gray-400 truncate">{map.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Visible points count badge */}
                {isActive && (
                  <span className="text-[10px] bg-green-500 text-white px-1 py-0.5 rounded-full font-medium min-w-[18px] text-center leading-none">
                    {status.visiblePoints}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {map.access_level === 'owner' ? 'власник' :
                   map.access_level === 'editor' ? 'редактор' :
                   map.access_level === 'viewer' ? 'глядач' : map.access_level}
                </span>
                {map.access_level === 'owner' && (
                  <button
                    onClick={(e) => handleDeleteClick(map, e)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Видалити"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-bold mb-4">Нова карта</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Назва *
                </label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Моя карта"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Опис
                </label>
                <textarea
                  value={newMapDescription}
                  onChange={(e) => setNewMapDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Опис карти (необов'язково)"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={!newMapName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Створити
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-800">Видалити карту?</h3>
            </div>
            <p className="text-center text-gray-600 mb-4">
              Ви впевнені, що хочете видалити карту<br />
              <span className="font-semibold text-gray-800">"{deleteConfirm.name}"</span>?
            </p>
            <p className="text-center text-sm text-red-500 mb-6">
              Цю дію неможливо скасувати. Всі групи та точки будуть видалені.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium"
              >
                Скасувати
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Instruction Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="bg-white rounded-lg overflow-hidden w-[90vw] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Інструкція: як експортувати карту з Google Maps</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="https://www.loom.com/embed/5b3aee8d2b074bd79ffb4f826bcc3fce"
                frameBorder="0"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
