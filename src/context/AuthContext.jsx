import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getDisplayName, needsDisplayName as userNeedsDisplayName } from '../utils/userProfile';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  displayName: '',
  needsDisplayName: false,
  saveDisplayName: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const needsDisplayName = useMemo(() => userNeedsDisplayName(user), [user]);
  const isAdmin = useMemo(() => user?.email === 'vikas12252@gmail.com', [user]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Supabase auth error:', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function saveDisplayName(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Name is required');

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });

    if (error) throw error;
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, needsDisplayName, saveDisplayName, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
