import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useMapStore = create((set, get) => ({
  // Maps
  maps: [],
  currentMap: null,
  mapsLoading: false,
  mapsError: null,

  // Groups
  groups: [],
  groupsLoading: false,

  // Points
  points: [],
  pointsLoading: false,

  // POI Layers
  poiLayers: [],
  poiPoints: {},
  poiLoading: false,

  // Cities
  cities: [],

  // ============================================
  // MAPS CRUD
  // ============================================

  fetchMaps: async () => {
    set({ mapsLoading: true, mapsError: null });

    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ mapsError: error.message, mapsLoading: false });
      return { error };
    }

    set({ maps: data, mapsLoading: false });
    return { data };
  },

  createMap: async (name, description = '') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('maps')
      .insert([{ name, description, user_id: user.id }])
      .select()
      .single();

    if (error) return { error };

    set(state => ({ maps: [data, ...state.maps] }));
    return { data };
  },

  updateMap: async (id, updates) => {
    const { data, error } = await supabase
      .from('maps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error };

    set(state => ({
      maps: state.maps.map(m => m.id === id ? data : m),
      currentMap: state.currentMap?.id === id ? data : state.currentMap,
    }));
    return { data };
  },

  deleteMap: async (id) => {
    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', id);

    if (error) return { error };

    set(state => ({
      maps: state.maps.filter(m => m.id !== id),
      currentMap: state.currentMap?.id === id ? null : state.currentMap,
    }));
    return {};
  },

  setCurrentMap: (map) => {
    set({ currentMap: map });
  },

  // ============================================
  // GROUPS CRUD
  // ============================================

  fetchGroups: async (mapId) => {
    set({ groupsLoading: true });

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('map_id', mapId)
      .order('sort_order', { ascending: true });

    if (error) {
      set({ groupsLoading: false });
      return { error };
    }

    set({ groups: data, groupsLoading: false });
    return { data };
  },

  createGroup: async (mapId, groupData) => {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ ...groupData, map_id: mapId }])
      .select()
      .single();

    if (error) return { error };

    set(state => ({ groups: [...state.groups, data] }));
    return { data };
  },

  updateGroup: async (id, updates) => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error };

    set(state => ({
      groups: state.groups.map(g => g.id === id ? data : g),
    }));
    return { data };
  },

  deleteGroup: async (id) => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) return { error };

    set(state => ({
      groups: state.groups.filter(g => g.id !== id),
      points: state.points.filter(p => p.group_id !== id),
    }));
    return {};
  },

  // ============================================
  // POINTS CRUD
  // ============================================

  fetchPoints: async (groupId) => {
    set({ pointsLoading: true });

    const { data, error } = await supabase
      .from('points')
      .select('*, comments(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ pointsLoading: false });
      return { error };
    }

    set(state => ({
      points: [
        ...state.points.filter(p => p.group_id !== groupId),
        ...data,
      ],
      pointsLoading: false,
    }));
    return { data };
  },

  fetchAllPoints: async (mapId) => {
    set({ pointsLoading: true });

    const { data, error } = await supabase
      .from('points')
      .select('*, comments(*), groups!inner(map_id)')
      .eq('groups.map_id', mapId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ pointsLoading: false });
      return { error };
    }

    set({ points: data, pointsLoading: false });
    return { data };
  },

  createPoint: async (groupId, pointData) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Generate Google Maps link
    const googleMapsLink = `https://www.google.com/maps?q=${pointData.lat},${pointData.lng}`;

    const { data, error } = await supabase
      .from('points')
      .insert([{
        ...pointData,
        group_id: groupId,
        google_maps_link: googleMapsLink,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (error) return { error };

    set(state => ({ points: [data, ...state.points] }));
    return { data };
  },

  updatePoint: async (id, updates) => {
    // Update Google Maps link if coordinates changed
    if (updates.lat && updates.lng) {
      updates.google_maps_link = `https://www.google.com/maps?q=${updates.lat},${updates.lng}`;
    }

    const { data, error } = await supabase
      .from('points')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error };

    set(state => ({
      points: state.points.map(p => p.id === id ? { ...p, ...data } : p),
    }));
    return { data };
  },

  deletePoint: async (id) => {
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', id);

    if (error) return { error };

    set(state => ({
      points: state.points.filter(p => p.id !== id),
    }));
    return {};
  },

  // ============================================
  // COMMENTS
  // ============================================

  addComment: async (pointId, text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('comments')
      .insert([{ point_id: pointId, user_id: user.id, text }])
      .select()
      .single();

    if (error) return { error };

    set(state => ({
      points: state.points.map(p => {
        if (p.id === pointId) {
          return {
            ...p,
            comments: [...(p.comments || []), data],
          };
        }
        return p;
      }),
    }));
    return { data };
  },

  deleteComment: async (commentId, pointId) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) return { error };

    set(state => ({
      points: state.points.map(p => {
        if (p.id === pointId) {
          return {
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId),
          };
        }
        return p;
      }),
    }));
    return {};
  },

  // ============================================
  // CITIES
  // ============================================

  fetchCities: async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) return { error };

    set({ cities: data });
    return { data };
  },

  // ============================================
  // POI LAYERS
  // ============================================

  fetchPoiLayers: async () => {
    set({ poiLoading: true });

    const { data, error } = await supabase
      .from('poi_layers')
      .select('*')
      .order('name');

    if (error) {
      set({ poiLoading: false });
      return { error };
    }

    set({ poiLayers: data, poiLoading: false });
    return { data };
  },

  fetchPoiPoints: async (layerId) => {
    const { data, error } = await supabase
      .from('poi_points')
      .select('*')
      .eq('layer_id', layerId);

    if (error) return { error };

    set(state => ({
      poiPoints: {
        ...state.poiPoints,
        [layerId]: data,
      },
    }));
    return { data };
  },

  // ============================================
  // UTILITIES
  // ============================================

  reset: () => {
    set({
      maps: [],
      currentMap: null,
      groups: [],
      points: [],
      mapsError: null,
    });
  },
}));
