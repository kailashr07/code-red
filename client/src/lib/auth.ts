import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const authStorage = {
  getUser: (): User | null => {
    const stored = localStorage.getItem('vit-studybuddy-user');
    return stored ? JSON.parse(stored) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem('vit-studybuddy-user', JSON.stringify(user));
  },

  removeUser: () => {
    localStorage.removeItem('vit-studybuddy-user');
  },

  isAuthenticated: (): boolean => {
    return !!authStorage.getUser();
  }
};

export const useAuth = () => {
  const user = authStorage.getUser();
  
  const login = (userData: User) => {
    authStorage.setUser(userData);
    window.location.href = '/dashboard';
  };

  const logout = () => {
    authStorage.removeUser();
    window.location.href = '/login';
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };
};
