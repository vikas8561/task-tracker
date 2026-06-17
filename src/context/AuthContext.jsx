import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getDisplayName, needsDisplayName as userNeedsDisplayName } from '../utils/userProfile';
import * as localAuth from '../lib/localAuth';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  displayName: '',
  needsDisplayName: false,
  saveDisplayName: async () => {},
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const needsDisplayName = useMemo(() => userNeedsDisplayName(user), [user]);
  const isAdmin = useMemo(() => user?.is_admin || user?.email === 'vikas12252@gmail.com', [user]);

  // Initialize from local storage — instant, no network call!
  useEffect(() => {
    const currentSession = localAuth.getCurrentSession();
    if (currentSession?.user) {
      setSession(currentSession);
      setUser(currentSession.user);
    }
    // Loading is done immediately — no waiting for network
    setLoading(false);

    // Listen for cross-tab changes
    const { unsubscribe } = localAuth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignIn(email, password) {
    const result = await localAuth.signIn(email, password);
    if (result.error) throw result.error;
    setSession(result.session);
    setUser(result.user);
    return result;
  }

  async function handleSignUp(email, password) {
    const result = await localAuth.signUp(email, password);
    if (result.error) throw result.error;
    setSession(result.session);
    setUser(result.user);
    return result;
  }

  function handleSignOut() {
    localAuth.signOut();
    setSession(null);
    setUser(null);
  }

  async function saveDisplayName(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Name is required');

    const result = await localAuth.updateUser({
      data: { display_name: trimmed },
    });

    if (result.error) throw result.error;
    setUser(result.data.user);
    return result.data.user;
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      displayName,
      needsDisplayName,
      saveDisplayName,
      isAdmin,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
