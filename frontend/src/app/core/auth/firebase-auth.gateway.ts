/**
 * Port to Firebase Authentication. The client uses Firebase only to sign up, sign in and out,
 * re-authenticate and send the verification and reset emails; every other call goes to Django,
 * with the ID token as `Authorization: Bearer`.
 */
export abstract class FirebaseAuthGateway {
  /** Creates the account and leaves it signed in. */
  abstract signUp(email: string, password: string): Promise<void>;
  abstract signIn(email: string, password: string): Promise<void>;
  abstract signOut(): Promise<void>;
  /** Waits for the stored session to be restored, then tells whether someone is signed in. */
  abstract hasUser(): Promise<boolean>;
  /**
   * The current ID token (refreshed by the SDK when it is about to expire), or null.
   * `forceRefresh` asks for a new one, so it carries the latest claims and sign-in time.
   */
  abstract getIdToken(forceRefresh?: boolean): Promise<string | null>;
  abstract sendEmailVerification(): Promise<void>;
  abstract sendPasswordReset(email: string): Promise<void>;
  /** Confirms the password of the signed-in user. */
  abstract reauthenticate(password: string): Promise<void>;
  abstract updatePassword(newPassword: string): Promise<void>;
  /** Deletes the signed-in Firebase user (rolls back a failed sign-up). */
  abstract deleteCurrentUser(): Promise<void>;
  /** Re-reads the user from Firebase, so `emailVerified` is current. */
  abstract reloadUser(): Promise<void>;
}
