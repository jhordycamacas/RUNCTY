import type { PersonalData } from '@/features/auth/domain';

/** `users/{uid}` as the account screens need it. */
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  idNumber?: string;
  role?: string;
}

export interface ProfileRepository {
  get(uid: string): Promise<UserProfile | null>;
  /** An empty `idNumber` removes it from the profile. */
  updatePersonalData(uid: string, data: PersonalData): Promise<void>;
}

export interface AccountGateway {
  /** Server-side deletion of credentials, profile and private data (callable). */
  deleteAccount(): Promise<void>;
}
