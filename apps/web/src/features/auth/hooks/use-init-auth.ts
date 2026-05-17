import { useEffect, useState } from 'react';
import { apiGetMe } from '../lib/auth-api';
import { useAuthStore } from '../store/auth.store';

export function useInitAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsInitialized(true);
      return;
    }

    apiGetMe(token)
      .then((user) => {
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        clearUser();
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  return { isInitialized };
}
