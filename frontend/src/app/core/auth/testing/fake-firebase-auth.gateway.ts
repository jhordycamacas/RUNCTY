import { FirebaseAuthGateway } from '../firebase-auth.gateway';

/**
 * In-memory `FirebaseAuthGateway` for specs. Every call is recorded in `calls` (in order); set
 * `failures[method]` to make that method reject.
 */
export class FakeFirebaseAuthGateway extends FirebaseAuthGateway {
  user = false;
  readonly calls: string[] = [];
  readonly failures: Partial<Record<keyof FirebaseAuthGateway, unknown>> = {};

  private record(method: keyof FirebaseAuthGateway, detail = ''): Promise<void> {
    this.calls.push(detail ? `${method}:${detail}` : method);
    return method in this.failures ? Promise.reject(this.failures[method]) : Promise.resolve();
  }

  async signUp(email: string, password: string): Promise<void> {
    await this.record('signUp', `${email}:${password}`);
    this.user = true;
  }
  async signIn(email: string, password: string): Promise<void> {
    await this.record('signIn', `${email}:${password}`);
    this.user = true;
  }
  async signOut(): Promise<void> {
    this.user = false;
    await this.record('signOut');
  }
  async hasUser(): Promise<boolean> {
    return this.user;
  }
  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (forceRefresh) await this.record('getIdToken', 'forced');
    return this.user ? 'token' : null;
  }
  sendEmailVerification = () => this.record('sendEmailVerification');
  sendPasswordReset = (email: string) => this.record('sendPasswordReset', email);
  reauthenticate = (password: string) => this.record('reauthenticate', password);
  updatePassword = (password: string) => this.record('updatePassword', password);
  deleteCurrentUser = () => this.record('deleteCurrentUser');
  reloadUser = () => this.record('reloadUser');
}
