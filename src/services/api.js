import { supabase } from '../lib/supabase';

// ============================================
// MAPS API
// ============================================

export const mapsApi = {
  // Get all maps for current user
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('map_access')
      .select(`
        access_level,
        maps (
          id,
          name,
          description,
          is_public,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map(item => ({ ...item.maps, access_level: item.access_level }));
  },

  // Get single map by ID
  async getById(mapId) {
    const { data, error } = await supabase
      .from('maps')
      .select(`
        *,
        groups (
          *,
          points (
            *,
            comments (
              *
            )
          )
        )
      `)
      .eq('id', mapId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new map
  async create(mapData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maps')
      .insert({
        name: mapData.name,
        description: mapData.description || '',
        user_id: user.id,
        is_public: mapData.is_public || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update map
  async update(mapId, updates) {
    const { data, error } = await supabase
      .from('maps')
      .update({
        name: updates.name,
        description: updates.description,
        is_public: updates.is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', mapId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete map
  async delete(mapId) {
    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', mapId);

    if (error) throw error;
    return true;
  }
};

// ============================================
// GROUPS API
// ============================================

export const groupsApi = {
  // Get all groups for a map
  async getByMapId(mapId) {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        points (*)
      `)
      .eq('map_id', mapId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create new group
  async create(groupData) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        map_id: groupData.map_id,
        name: groupData.name,
        color: groupData.color || '#FF5252',
        default_radius: groupData.default_radius || 1000,
        type: groupData.type || 'brand',
        sort_order: groupData.sort_order || 0,
        polygons: groupData.polygons || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update group
  async update(groupId, updates) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.default_radius !== undefined) updateData.default_radius = updates.default_radius;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
    if (updates.polygons !== undefined) updateData.polygons = updates.polygons;

    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete group
  async delete(groupId) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return true;
  }
};

// ============================================
// POINTS API
// ============================================

export const pointsApi = {
  // Get all points for a group
  async getByGroupId(groupId) {
    const { data, error } = await supabase
      .from('points')
      .select(`
        *,
        comments (*)
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    return data;
  },

  // Create new point
  async create(pointData) {
    const { data, error } = await supabase
      .from('points')
      .insert({
        group_id: pointData.group_id,
        city_id: pointData.city_id,
        name: pointData.name,
        address: pointData.address || '',
        lat: pointData.lat,
        lng: pointData.lng,
        status: pointData.status || 'under_review',
        google_maps_link: pointData.google_maps_link || `https://www.google.com/maps?q=${pointData.lat},${pointData.lng}`,
        phone: pointData.phone || '',
        website: pointData.website || '',
        metadata: pointData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update point
  async update(pointId, updates) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.lat !== undefined) updateData.lat = updates.lat;
    if (updates.lng !== undefined) updateData.lng = updates.lng;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.google_maps_link !== undefined) updateData.google_maps_link = updates.google_maps_link;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.group_id !== undefined) updateData.group_id = updates.group_id;
    if (updates.city_id !== undefined) updateData.city_id = updates.city_id;

    const { data, error } = await supabase
      .from('points')
      .update(updateData)
      .eq('id', pointId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete point
  async delete(pointId) {
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', pointId);

    if (error) throw error;
    return true;
  }
};

// ============================================
// COMMENTS API
// ============================================

export const commentsApi = {
  // Get all comments for a point
  async getByPointId(pointId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('point_id', pointId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create new comment
  async create(commentData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        point_id: commentData.point_id,
        user_id: user.id,
        text: commentData.text
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update comment
  async update(commentId, text) {
    const { data, error } = await supabase
      .from('comments')
      .update({
        text,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete comment
  async delete(commentId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  }
};

// ============================================
// CITIES API
// ============================================

export const citiesApi = {
  // Get all cities
  async getAll() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get city by coordinates (nearest)
  async getByCoordinates(lat, lng) {
    // Simple distance calculation - find nearest city
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*');

    if (error) throw error;

    let nearestCity = null;
    let minDistance = Infinity;

    cities.forEach(city => {
      const distance = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    });

    return nearestCity;
  }
};

// ============================================
// MAP ACCESS API
// ============================================

export const mapAccessApi = {
  // Get all users with access to a map
  async getByMapId(mapId) {
    const { data, error } = await supabase
      .from('map_access')
      .select('*')
      .eq('map_id', mapId);

    if (error) throw error;
    return data;
  },

  // Grant access to a user
  async grant(mapId, userId, accessLevel) {
    const { data, error } = await supabase
      .from('map_access')
      .insert({
        map_id: mapId,
        user_id: userId,
        access_level: accessLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update access level
  async update(mapId, userId, accessLevel) {
    const { data, error } = await supabase
      .from('map_access')
      .update({ access_level: accessLevel })
      .eq('map_id', mapId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Revoke access
  async revoke(mapId, userId) {
    const { error } = await supabase
      .from('map_access')
      .delete()
      .eq('map_id', mapId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  // Check user's access level for a map
  async checkAccess(mapId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('map_access')
      .select('access_level')
      .eq('map_id', mapId)
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data?.access_level;
  }
};

// ============================================
// KYIVSTAR HEXAGONS API
// ============================================

export const kyivstarApi = {
  // Get all hexagons
  async getAll(layerName = null) {
    let query = supabase
      .from('kyivstar_hexagons')
      .select('*');

    if (layerName) {
      query = query.eq('layer_name', layerName);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Get hexagons for active clients layer
  async getActiveClients() {
    return this.getAll('active_clients');
  },

  // Get hexagons for terminated clients layer
  async getTerminatedClients() {
    return this.getAll('terminated_clients');
  },

  // Bulk insert hexagons (for data updates)
  async bulkInsert(hexagons, sourceFile = null) {
    const records = hexagons.map(hex => ({
      hex_id: hex.hex_id,
      coordinates: hex.coordinates,
      layer_name: hex.layer_name || 'active_clients',
      source_file: sourceFile
    }));

    const { data, error } = await supabase
      .from('kyivstar_hexagons')
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  },

  // Clear all hexagons (for full data refresh)
  async clearAll(layerName = null) {
    let query = supabase
      .from('kyivstar_hexagons')
      .delete();

    if (layerName) {
      query = query.eq('layer_name', layerName);
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  },

  // Replace all hexagons (clear + insert)
  async replaceAll(hexagons, sourceFile = null, layerName = 'active_clients') {
    await this.clearAll(layerName);
    return this.bulkInsert(hexagons, sourceFile);
  }
};

// ============================================
// APOLLO CLUBS API
// ============================================

export const apolloClubsApi = {
  // Get all Apollo clubs
  async getAll() {
    const { data, error } = await supabase
      .from('apollo_clubs')
      .select('*')
      .order('club_id');

    if (error) throw error;
    return data;
  },

  // Get clubs by city
  async getByCity(city) {
    const { data, error } = await supabase
      .from('apollo_clubs')
      .select('*')
      .eq('city', city)
      .order('club_id');

    if (error) throw error;
    return data;
  }
};
