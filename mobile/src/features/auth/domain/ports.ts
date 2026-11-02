/** Ports of the auth feature. Implemented by Firebase adapters in `infrastructure/`. */

export type Unsubscribe = () => void;

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

/** Profile written to `users/{uid}` at sign-up. Never includes `role`. */
export interface NewUserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  idNumber?: string;
}

export interface AuthGateway {
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendEmailVerification(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Deletes the signed-in auth user (used to roll back a failed sign-up). */
  deleteCurrentUser(): Promise<void>;
  /** Confirms the current password of the signed-in user. */
  reauthenticate(password: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  onAuthStateChanged(listener: (user: AuthUser | null) => void): Unsubscribe;
  /** Role from the ID token custom claims. `forceRefresh` fetches a new token. */
  getRole(forceRefresh: boolean): Promise<string | null>;
}

export interface UserDocGateway {
  /** Creates `users/{uid}` with LOPDP consent and server timestamps. */
  createUserDoc(profile: NewUserProfile): Promise<void>;
  /** Watches the `role` mirror written by Cloud Functions after the claim. */
  watchRole(uid: string, listener: (role: string | null) => void): Unsubscribe;
}
