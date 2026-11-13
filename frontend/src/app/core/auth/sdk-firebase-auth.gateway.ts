import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  EmailAuthProvider,
  User,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { FirebaseAuthGateway } from './firebase-auth.gateway';

/** Firebase JS SDK adapter of `FirebaseAuthGateway`. */
@Injectable()
export class SdkFirebaseAuthGateway extends FirebaseAuthGateway {
  private readonly auth: Auth = this.createAuth();

  private createAuth(): Auth {
    const auth = getAuth(initializeApp(environment.firebase));
    // Verification and reset emails in Spanish.
    auth.languageCode = 'es';
    if (environment.authEmulatorUrl) {
      connectAuthEmulator(auth, environment.authEmulatorUrl, { disableWarnings: true });
    }
    return auth;
  }

  async signUp(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  async hasUser(): Promise<boolean> {
    await this.auth.authStateReady();
    return this.auth.currentUser !== null;
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    return (await this.auth.currentUser?.getIdToken(forceRefresh)) ?? null;
  }

  sendEmailVerification(): Promise<void> {
    return sendEmailVerification(this.requireUser());
  }

  sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  async reauthenticate(password: string): Promise<void> {
    const user = this.requireUser();
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email ?? '', password),
    );
  }

  updatePassword(newPassword: string): Promise<void> {
    return updatePassword(this.requireUser(), newPassword);
  }

  deleteCurrentUser(): Promise<void> {
    return deleteUser(this.requireUser());
  }

  reloadUser(): Promise<void> {
    return this.requireUser().reload();
  }

  private requireUser(): User {
    const user = this.auth.currentUser;
    if (!user)
      throw Object.assign(new Error('No signed-in user'), { code: 'auth/requires-recent-login' });
    return user;
  }
}
