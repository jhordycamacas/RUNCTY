/**
 * Public API of the auth feature for other features and the app shell.
 * Infrastructure stays private; only the bound `authGateway` port is shared.
 */
export * from './domain';
/** Auth port bound to Firebase, for features that need re-authentication. */
export { authGateway } from './composition';
export { PersonalDataFields } from './presentation/components/PersonalDataFields';
export {
  SessionProvider,
  useSession,
  useSignedInUser,
  type Session,
  type SessionStatus,
} from './presentation/session/SessionProvider';
