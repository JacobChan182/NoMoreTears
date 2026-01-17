import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, BehavioralCluster } from '@/types';
import { generatePseudonymId } from '@/data/mockData';
import { trackLoginEvent } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clusters: BehavioralCluster[] = ['high-replay', 'fast-watcher', 'note-taker', 'late-night-learner', 'steady-pacer'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (role: UserRole) => {
    const newUser: User = {
      id: `${role}-${Date.now()}`,
      pseudonymId: generatePseudonymId(),
      role,
      courseIds: ['course-1', 'course-2'],
      cluster: role === 'student' ? clusters[Math.floor(Math.random() * clusters.length)] : undefined,
      createdAt: new Date(),
    };
    setUser(newUser);

    // Track login/signup event to MongoDB
    try {
      await trackLoginEvent(
        newUser.id,
        newUser.pseudonymId,
        role,
        'signin' // You can change this to 'signup' if this is first-time registration
      );
    } catch (error) {
      console.error('Failed to track login event to MongoDB:', error);
      // Continue even if API call fails
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
