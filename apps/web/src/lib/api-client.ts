import { client } from '@/generated/client.gen';

client.setConfig({
  baseUrl: '',
});

client.interceptors.request.use((request) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});
