export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  size: number;
}
