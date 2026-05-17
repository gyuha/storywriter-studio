import type { AuthUser, TokenResponse } from '../types/auth';

const BASE = '/api/v1';

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? '로그인에 실패했습니다');
  }
  return res.json() as Promise<TokenResponse>;
}

export async function apiSignup(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? '회원가입에 실패했습니다');
  }
}

export async function apiGetMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('401');
  return res.json() as Promise<AuthUser>;
}

export async function apiLogout(accessToken: string, refreshToken: string): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
