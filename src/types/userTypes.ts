export interface CreateUserBody {
  email: string;
  name?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
}
