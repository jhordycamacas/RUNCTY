/** Minimum characters of a name search (the API refuses shorter text). */
export const MIN_SEARCH_CHARS = 3;

/** The limited public profile of another account: never an email, id number or birth date. */
export interface PublicProfile {
  uid: string;
  firstName: string;
  lastName: string;
  cityId: string;
}

export interface Friend {
  profile: PublicProfile;
  /** ISO 8601 moment the friendship started. */
  since: string;
}

/** A pending request; `profile` is the other account (the sender or the recipient). */
export interface FriendRequest {
  id: string;
  profile: PublicProfile;
}

export interface PendingRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export type FriendRelation = 'none' | 'friend' | 'request-sent' | 'request-received';

export interface SearchResult {
  profile: PublicProfile;
  relation: FriendRelation;
}

export function fullName(profile: PublicProfile): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

/** Friends, requests and name search of the signed-in account (RF-22). */
export abstract class FriendRepository {
  abstract list(): Promise<Friend[]>;
  /** Idempotent: removing someone who is not a friend does nothing. */
  abstract remove(uid: string): Promise<void>;
  abstract pending(): Promise<PendingRequests>;
  abstract send(toUid: string): Promise<void>;
  abstract accept(requestId: string): Promise<void>;
  abstract reject(requestId: string): Promise<void>;
  /** The sender withdraws a pending request. */
  abstract cancel(requestId: string): Promise<void>;
  abstract search(text: string): Promise<SearchResult[]>;
}
