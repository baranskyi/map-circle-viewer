import { create } from 'zustand';
import { mapsApi, groupsApi, pointsApi, commentsApi, citiesApi } from '../services/api';

export const useDataStore = create((set, get) => ({
  // State
  maps: [],
  currentMap: null,
  groups: [],
  cities: [],
  loading: false,
  error: null,

  // ============================================
  // MAPS
  // ============================================

  fetchMaps: async () => {
    set({ loading: true, error: null });
    try {
      const maps = await mapsApi.getAll();
      set({ maps, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMap: async (mapId) => {
    set({ loading: true, error: null });
    try {
      const map = await mapsApi.getById(mapId);
      set({ currentMap: map, groups: map.groups || [], loading: false });
      return map;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createMap: async (mapData) => {
    set({ loading: true, error: null });
    try {
      const newMap = await mapsApi.create(mapData);
      set(state => ({
        maps: [...state.maps, newMap],
        loading: false
      }));
      return newMap;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateMap: async (mapId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedMap = await mapsApi.update(mapId, updates);
      set(state => ({
        maps: state.maps.map(m => m.id === mapId ? updatedMap : m),
        currentMap: state.currentMap?.id === mapId ? { ...state.currentMap, ...updatedMap } : state.currentMap,
        loading: false
      }));
      return updatedMap;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteMap: async (mapId) => {
    set({ loading: true, error: null });
    try {
      await mapsApi.delete(mapId);
      set(state => ({
        maps: state.maps.filter(m => m.id !== mapId),
        currentMap: state.currentMap?.id === mapId ? null : state.currentMap,
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ============================================
  // GROUPS
  // ============================================

  createGroup: async (groupData) => {
    set({ loading: true, error: null });
    try {
      const newGroup = await groupsApi.create(groupData);
      set(state => ({
        groups: [...state.groups, { ...newGroup, points: [] }],
        loading: false
      }));
      return newGroup;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateGroup: async (groupId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedGroup = await groupsApi.update(groupId, updates);
      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId ? { ...g, ...updatedGroup } : g
        ),
        loading: false
      }));
      return updatedGroup;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      await groupsApi.delete(groupId);
      set(state => ({
        groups: state.groups.filter(g => g.id !== groupId),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ============================================
  // POINTS
  // ============================================

  createPoint: async (pointData) => {
    set({ loading: true, error: null });
    try {
      const newPoint = await pointsApi.create(pointData);
      set(state => ({
        groups: state.groups.map(g =>
          g.id === pointData.group_id
            ? { ...g, points: [...(g.points || []), { ...newPoint, comments: [] }] }
            : g
        ),
        loading: false
      }));
      return newPoint;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updatePoint: async (pointId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedPoint = await pointsApi.update(pointId, updates);
      set(state => ({
        groups: state.groups.map(g => ({
          ...g,
          points: (g.points || []).map(p =>
            p.id === pointId ? { ...p, ...updatedPoint } : p
          )
        })),
        loading: false
      }));
      return updatedPoint;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deletePoint: async (pointId, groupId) => {
    set({ loading: true, error: null });
    try {
      await pointsApi.delete(pointId);
      set(state => ({
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, points: (g.points || []).filter(p => p.id !== pointId) }
            : g
        ),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  movePoint: async (pointId, fromGroupId, toGroupId) => {
    const { groups } = get();
    const fromGroup = groups.find(g => g.id === fromGroupId);
    const point = fromGroup?.points?.find(p => p.id === pointId);

    if (!point) return false;

    set({ loading: true, error: null });
    try {
      await pointsApi.update(pointId, { group_id: toGroupId });
      set(state => ({
        groups: state.groups.map(g => {
          if (g.id === fromGroupId) {
            return { ...g, points: (g.points || []).filter(p => p.id !== pointId) };
          }
          if (g.id === toGroupId) {
            return { ...g, points: [...(g.points || []), { ...point, group_id: toGroupId }] };
          }
          return g;
        }),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ============================================
  // COMMENTS
  // ============================================

  addComment: async (pointId, text) => {
    set({ loading: true, error: null });
    try {
      const newComment = await commentsApi.create({ point_id: pointId, text });
      set(state => ({
        groups: state.groups.map(g => ({
          ...g,
          points: (g.points || []).map(p =>
            p.id === pointId
              ? { ...p, comments: [newComment, ...(p.comments || [])] }
              : p
          )
        })),
        loading: false
      }));
      return newComment;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteComment: async (commentId, pointId) => {
    set({ loading: true, error: null });
    try {
      await commentsApi.delete(commentId);
      set(state => ({
        groups: state.groups.map(g => ({
          ...g,
          points: (g.points || []).map(p =>
            p.id === pointId
              ? { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) }
              : p
          )
        })),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ============================================
  // CITIES
  // ============================================

  fetchCities: async () => {
    try {
      const cities = await citiesApi.getAll();
      set({ cities });
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  },

  // ============================================
  // UTILITIES
  // ============================================

  clearError: () => set({ error: null }),

  setCurrentMap: (map) => set({ currentMap: map, groups: map?.groups || [] }),

  reset: () => set({
    maps: [],
    currentMap: null,
    groups: [],
    loading: false,
    error: null
  })
}));
