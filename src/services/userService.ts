// src/services/userService.ts
import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string;
  deleted: boolean;
  userName: string;
  type: string;
  authMethod: string | null;
  salutationName: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  title: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  ipAddress?: string;
  avatarColor: string | null;
  gender: string | null;
  createdAt: string;
  modifiedAt: string;
  auth2FA: string | null;
  middleName: string | null;
  emailAddressIsOptedOut: boolean | null;
  emailAddressIsInvalid: boolean | null;
  phoneNumberIsOptedOut: boolean | null;
  phoneNumberIsInvalid: boolean | null;
  defaultTeamId: string | null;
  defaultTeamName: string | null;
  teamsIds: string[];
  teamsNames: Record<string, string>;
  teamsColumns: Record<string, any>;
  contactId: string | null;
  contactName: string | null;
  avatarId: string | null;
  avatarName: string | null;
  createdById: string;
  createdByName: string;
  dashboardTemplateId: string | null;
  dashboardTemplateName: string | null;
  workingTimeCalendarId: string | null;
  layoutSetId: string | null;
  emailAddressList?: any[];
  userEmailAddressList?: any[];
  excludeFromReplyEmailAddressList?: any[];
}

export interface AppUserResponse {
  user: User;
  acl: any;
  preferences: any;
  token: string | null;
  settings: any;
  language: string;
  appParams: any;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  title?: string | null;
  middleName?: string | null;
  gender?: string | null;
}

export interface ChangePasswordData {
  password: string;
  currentPassword: string;
}

export const userService = {
  /**
   * Načte aktuálního přihlášeného uživatele
   * API vrací komplexní objekt s user, acl, preferences atd.
   */
  async getCurrentUser(): Promise<User> {
    console.log('👤 Getting current user...');
    const response = await apiClient.get<AppUserResponse>('/App/user');
    // Vrátíme pouze user část z response
    return response.user;
  },

  /**
   * Vrátí URL pro avatar uživatele
   * @param userId - ID uživatele
   * @param size - Velikost avataru (small, medium, large)
   */
  getAvatarUrl(userId: string, size: 'small' | 'medium' | 'large' = 'small'): string {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const timestamp = Date.now();
    return `${baseUrl}/?entryPoint=avatar&size=${size}&id=${userId}&t=${timestamp}`;
  },

  /**
   * Načte konkrétního uživatele podle ID
   */
  async getById(id: string): Promise<User> {
    console.log('👤 Getting user:', id);
    return apiClient.get<User>(`/User/${id}`);
  },

  /**
   * Aktualizuje uživatelský profil
   */
  async updateProfile(userId: string, data: UpdateUserData): Promise<User> {
    console.log('✏️ Updating user profile:', userId, data);
    return apiClient.put<User>(`/User/${userId}`, data);
  },

  /**
   * Změní heslo uživatele
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    console.log('🔐 Changing password for user:', userId);
    await apiClient.put(`/UserSecurity/password`, data);
  },

  /**
   * Nahraje avatar uživatele
   * Použije Attachment API pro upload
   */
  async uploadAvatar(userId: string, file: File): Promise<User> {
    console.log('📸 Uploading avatar for user:', userId);
    
    // 1. Nejdřív nahrajeme soubor jako Attachment
    const formData = new FormData();
    formData.append('file', file);
    
    const attachment = await apiClient.post<{ id: string; name: string }>('/Attachment', formData);
    
    // 2. Pak připojíme avatarId k uživateli
    return await apiClient.put<User>(`/User/${userId}`, {
      avatarId: attachment.id
    });
  },

  /**
   * Smaže avatar uživatele
   */
  async deleteAvatar(userId: string): Promise<void> {
    console.log('🗑️ Deleting avatar for user:', userId);
    // Nastavíme avatarId na null
    await apiClient.put(`/User/${userId}`, {
      avatarId: null
    });
  }
};