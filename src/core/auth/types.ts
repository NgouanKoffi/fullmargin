// src/auth/types.ts

export type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];

  // 👇 Champs optionnels utilisés par la page Profil/Sécurité
  googleLinked?: boolean | null;  // true si compte lié à Google
  localEnabled?: boolean | null;  // true si connexion par mot de passe autorisée
  twoFAEnabled?: boolean | null;  // true si 2FA activée
};

export type Session = {
  token: string;
  user: User;
  expiresAt: number;
};

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: User };

export type AuthCtx = AuthState & {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (fullName: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setSession: (s: Session) => void;
};