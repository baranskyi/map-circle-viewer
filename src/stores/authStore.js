import { create } from 'zustand';
import { supabase, signIn, signUp, signOut } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Sign in with email/password
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        set({ error: error.message, loading: false });
        return { error };
      }

      if (!data?.user) {
        const msg = 'Подтвердите email перед входом (проверьте почту)';
        set({ error: msg, loading: false });
        return { error: { message: msg } };
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
      return { data };
    } catch (err) {
      console.error('Login exception:', err);
      set({ error: err.message || 'Ошибка входа', loading: false });
      return { error: err };
    }
  },

  // Sign up with email/password
  register: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await signUp(email, password);

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    });
    return { data };
  },

  // Sign out
  logout: async () => {
    set({ loading: true, error: null });
    const { error } = await signOut();

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({
      user: null,
      session: null,
      loading: false,
    });
    return {};
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
