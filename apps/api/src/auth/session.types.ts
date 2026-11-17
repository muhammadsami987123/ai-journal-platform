export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

export interface ActiveSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface RequestAuth {
  user: AuthenticatedUser;
  session: ActiveSession;
}
