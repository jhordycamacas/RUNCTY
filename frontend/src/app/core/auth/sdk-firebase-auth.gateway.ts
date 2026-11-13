import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { FirebaseAuthGateway } from './firebase-auth.gateway';

/** Firebase JS SDK adapter of `FirebaseAuthGateway`. */
@Injectable()
export class SdkFirebaseAuthGateway extends FirebaseAuthGateway {
  private readonly auth: Auth = this.createAuth();

  private createAuth(): Auth {
    const auth = getAuth(initializeApp(environment.firebase));
    if (environment.authEmulatorUrl) {
      connectAuthEmulator(auth, environment.authEmulatorUrl, { disableWarnings: true });
    }
    return auth;
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

  async getIdToken(): Promise<string | null> {
    return (await this.auth.currentUser?.getIdToken()) ?? null;
  }
}
