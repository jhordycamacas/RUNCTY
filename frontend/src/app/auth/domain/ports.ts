import { PersonalData } from './personal-data';

/** Profile created at sign-up (`POST /users`); the API takes uid and email from the token. */
export type NewUserProfile = Omit<PersonalData, 'idNumber'> & { idNumber?: string };

export abstract class UsersRepository {
  /** Creates the profile of the signed-in account and assigns the default role (LOPDP consent included). */
  abstract create(profile: NewUserProfile): Promise<void>;
}
