import type { User, LoginCredentials, RegisterData } from '@/types/auth';

const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@naturalprotein.cz',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    token: 'mock-jwt-token-admin'
  },
  {
    id: 2,
    email: 'user@naturalprotein.cz',
    password: 'user123',
    firstName: 'Jan',
    lastName: 'Novák',
    role: 'user',
    token: 'mock-jwt-token-user'
  }
];

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Nesprávné přihlašovací údaje');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  async register(data: RegisterData): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const exists = MOCK_USERS.find(u => u.email === data.email);
    if (exists) {
      throw new Error('Uživatel s tímto emailem již existuje');
    }

    const newUser = {
      id: MOCK_USERS.length + 1,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'user',
      token: `mock-jwt-token-${Date.now()}`
    };

    MOCK_USERS.push({ ...newUser, password: data.password } as any);

    return newUser as User;
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return `refreshed-token-${Date.now()}`;
  }
};