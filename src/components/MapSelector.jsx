import { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';

export default function MapSelector({ onMapSelect }) {
  const { user } = useAuthStore();
  const { maps, loading, error, fetchMaps, createMap, deleteMap } = useDataStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');

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

  const handleDelete = async (mapId, e) => {
    e.stopPropagation();
    if (confirm('Ви впевнені, що хочете видалити цю карту?')) {
      await deleteMap(mapId);
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
        <h3 className="font-semibold text-gray-700">Мої карти</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          + Нова
        </button>
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
        {maps.map(map => (
          <div
            key={map.id}
            onClick={() => onMapSelect(map.id)}
            className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 group"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{map.name}</div>
              {map.description && (
                <div className="text-xs text-gray-400 truncate">{map.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 capitalize">{map.access_level}</span>
              {map.access_level === 'owner' && (
                <button
                  onClick={(e) => handleDelete(map.id, e)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Видалити"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
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
    </div>
  );
}
