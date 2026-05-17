import {
  getMeApiV1AuthMeGet,
  loginApiV1AuthLoginPost,
  logoutApiV1AuthLogoutPost,
  signupApiV1AuthSignupPost,
} from '@/generated/sdk.gen';
import type { AuthUser, TokenResponse } from '../types/auth';

function throwOnError(error: unknown, fallback: string): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? fallback);
  }
  throw new Error(fallback);
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const { data, error } = await loginApiV1AuthLoginPost({ body: { email, password } });
  if (error) throwOnError(error, '로그인에 실패했습니다');
  return data as TokenResponse;
}

export async function apiSignup(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  const { error } = await signupApiV1AuthSignupPost({
    body: { email, password, display_name: displayName },
  });
  if (error) throwOnError(error, '회원가입에 실패했습니다');
}

export async function apiGetMe(_token: string): Promise<AuthUser> {
  const { data, error } = await getMeApiV1AuthMeGet();
  if (error) throw new Error('401');
  return data as AuthUser;
}

export async function apiLogout(_accessToken: string, refreshToken: string): Promise<void> {
  await logoutApiV1AuthLogoutPost({ body: { refresh_token: refreshToken } });
}
