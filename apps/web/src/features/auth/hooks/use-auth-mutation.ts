import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { apiGetMe, apiLogin, apiLogout, apiSignup } from '../lib/auth-api';
import { useAuthStore } from '../store/auth.store';
import type { LoginInput, SignupInput } from '../types/auth';

export function useLoginMutation() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const tokenResponse = await apiLogin(data.email, data.password);
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      return apiGetMe(tokenResponse.access_token);
    },
    onSuccess: (user) => {
      setUser(user);
      navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다');
    },
  });
}

export function useSignupMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SignupInput) => {
      await apiSignup(data.email, data.password, data.name);
      const tokenResponse = await apiLogin(data.email, data.password);
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    },
    onSuccess: () => {
      toast.success('가입이 완료되었습니다!');
      navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다');
    },
  });
}

export function useLogoutMutation() {
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  return useMutation({
    mutationFn: async () => {
      const accessToken = localStorage.getItem('access_token') ?? '';
      const refreshToken = localStorage.getItem('refresh_token') ?? '';
      await apiLogout(accessToken, refreshToken);
    },
    onSuccess: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearUser();
      navigate({ to: '/auth/login' });
    },
    onError: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearUser();
      navigate({ to: '/auth/login' });
    },
  });
}
