/**
 * Public API of the auth feature for other features and the app shell.
 * Infrastructure and composition stay private.
 */
export * from './domain';
export { PersonalDataFields } from './presentation/components/PersonalDataFields';
export {
  SessionProvider,
  useSession,
  useSignedInUser,
  type Session,
  type SessionStatus,
} from './presentation/session/SessionProvider';
