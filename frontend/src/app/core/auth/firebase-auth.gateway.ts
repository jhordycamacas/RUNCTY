/**
 * Port to Firebase Authentication. The client uses Firebase only to sign in and to obtain the
 * ID token that goes to the API as `Authorization: Bearer`; every other call goes to Django.
 */
export abstract class FirebaseAuthGateway {
  abstract signIn(email: string, password: string): Promise<void>;
  abstract signOut(): Promise<void>;
  /** Waits for the stored session to be restored, then tells whether someone is signed in. */
  abstract hasUser(): Promise<boolean>;
  /** The current ID token (refreshed by the SDK when it is about to expire), or null. */
  abstract getIdToken(): Promise<string | null>;
}
