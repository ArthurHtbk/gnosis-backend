export interface CreateUserBody {
  email: string;
  name?: string;
}

export interface UserResponse {
  id: number;
  supabaseId: string;
  email: string;
  name: string | null;
  createdAt: Date;
}
