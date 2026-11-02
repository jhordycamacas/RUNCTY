import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getIdTokenResult,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
  type User,
} from 'firebase/auth';

import type { AuthGateway, AuthUser } from '../domain';

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email ?? '', emailVerified: user.emailVerified };
}

function requireUser(auth: Auth): User {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('No signed-in user'), { code: 'auth/requires-recent-login' });
  return user;
}

export function createFirebaseAuthGateway(auth: Auth): AuthGateway {
  // Password reset and verification emails in Spanish.
  auth.languageCode = 'es';

  return {
    async signUp(email, password) {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      return toAuthUser(user);
    },
    async signIn(email, password) {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return toAuthUser(user);
    },
    signOut: () => signOut(auth),
    sendEmailVerification: () => sendEmailVerification(requireUser(auth)),
    sendPasswordReset: (email) => sendPasswordResetEmail(auth, email),
    deleteCurrentUser: () => deleteUser(requireUser(auth)),
    async reauthenticate(password) {
      const user = requireUser(auth);
      const credential = EmailAuthProvider.credential(user.email ?? '', password);
      await reauthenticateWithCredential(user, credential);
    },
    updatePassword: (newPassword) => updatePassword(requireUser(auth), newPassword),
    onAuthStateChanged: (listener) => onAuthStateChanged(auth, (user) => listener(user ? toAuthUser(user) : null)),
    async getRole(forceRefresh) {
      const user = auth.currentUser;
      if (!user) return null;
      const { claims } = await getIdTokenResult(user, forceRefresh);
      return typeof claims.role === 'string' ? claims.role : null;
    },
  };
}
