import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../../shared/types';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subjectHeadOf?: string | null;
  teacherAssignments?: Array<{
    classId: string;
    subjectId: string;
    class: { name: string };
    subject: { code: string; name: string };
  }>;
}

export interface Cycle {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  targetLevel: number;
  status: string;
}

interface AppContextType {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (email: string) => void;
  availableUsers: CurrentUser[];
  activeCycle: Cycle | null;
  setActiveCycle: (cycle: Cycle) => void;
  availableCycles: Cycle[];
  language: 'ms' | 'en';
  setLanguage: (lang: 'ms' | 'en') => void;
  t: (ms: string, en: string) => string;
  isOnline: boolean;
  maskPII: boolean;
  setMaskPII: (mask: boolean) => void;
  reloadStatsTrigger: number;
  triggerReloadStats: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<CurrentUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('my_sas_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [availableCycles, setAvailableCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [language, setLanguage] = useState<'ms' | 'en'>('ms');
  const [isOnline] = useState<boolean>(true);
  const [maskPII, setMaskPII] = useState<boolean>(true);
  const [reloadStatsTrigger, setReloadStatsTrigger] = useState<number>(0);

  const triggerReloadStats = () => setReloadStatsTrigger(prev => prev + 1);

  // Load users & cycles on mount
  useEffect(() => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableUsers(data);
          // If currentUser is set, refresh with latest data from DB
          setCurrentUser(prev => {
            if (!prev) return null;
            const updated = data.find((u: any) => u.id === prev.id || u.email === prev.email);
            if (updated) {
              localStorage.setItem('my_sas_user', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      })
      .catch(err => console.error('Error loading users:', err));

    fetch('/api/cycles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableCycles(data);
          const active = data.find((c: any) => c.status === 'ACTIVE') || data[0];
          setActiveCycle(active);
        }
      })
      .catch(err => console.error('Error loading cycles:', err));
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Log masuk gagal.' };
      }
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('my_sas_user', JSON.stringify(data.user));
        triggerReloadStats();
        return { success: true };
      }
      return { success: false, error: 'Maklumat pengguna tidak sah.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ralat rangkaian semasa log masuk.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (currentUser) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
          }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('my_sas_user');
      setCurrentUser(null);
      triggerReloadStats();
    }
  };

  const switchUser = (email: string) => {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('my_sas_user', JSON.stringify(data.user));
          triggerReloadStats();
        }
      })
      .catch(err => console.error('Error switching user:', err));
  };

  const t = (ms: string, en: string) => (language === 'ms' ? ms : en);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchUser,
        availableUsers,
        activeCycle,
        setActiveCycle,
        availableCycles,
        language,
        setLanguage,
        t,
        isOnline,
        maskPII,
        setMaskPII,
        reloadStatsTrigger,
        triggerReloadStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
