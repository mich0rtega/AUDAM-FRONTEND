import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, UserEnvironment, Role } from '../types';

interface AuthContextType {
  user: User | null;
  currentEnvironment: UserEnvironment | null;
  environments: UserEnvironment[];
  role: Role | null;
  login: (credentials: { email: string; password: string }) => Promise<UserEnvironment[]>;
  selectEnvironment: (env: UserEnvironment) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [environments, setEnvironments] = useState<UserEnvironment[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<UserEnvironment | null>(null);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    const savedEnv = localStorage.getItem('currentEnvironment');

    authService.getProfile()
      .then(async (profile) => {
       
        setUser({ id: profile.userId, email: profile.email });

        // Cargar entornos
        const envs = await authService.getEnvironments().catch(() => []);
        setEnvironments(envs);

     
        if (savedEnv && envs.length > 0) {
          const parsed = JSON.parse(savedEnv);
          const found = envs.find(e => e.environmentId === parsed.environmentId);
          if (found) setCurrentEnvironment(found);
        }
      })
      .catch(() => {
        setUser(null);
        setEnvironments([]);
        setCurrentEnvironment(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<UserEnvironment[]> => {
 
    await authService.login(credentials);

   
    const profile = await authService.getProfile();
    setUser({ id: profile.userId, email: profile.email });

   
    const envs = await authService.getEnvironments();
    setEnvironments(envs);

    return envs;
  };

  const selectEnvironment = async (env: UserEnvironment) => {
    
    await authService.selectEnvironment(env.environmentId);
    setCurrentEnvironment(env);
    localStorage.setItem('currentEnvironment', JSON.stringify(env));
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    setUser(null);
    setEnvironments([]);
    setCurrentEnvironment(null);
    localStorage.removeItem('currentEnvironment');
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentEnvironment,
      environments,
      role: currentEnvironment?.role || null,
      login,
      selectEnvironment,
      logout,
      loading,
      isAuthenticated: !!user && !!currentEnvironment,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
