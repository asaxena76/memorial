"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { userProfileSchema, type UserProfile } from "@/lib/models/user";

export type AuthClaims = {
  approved?: boolean;
  admin?: boolean;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: User | null;
  claims: AuthClaims | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setClaims(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setLoading(true);

      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        setClaims(tokenResult.claims as AuthClaims);
      } catch (error) {
        console.error("Failed to load auth claims", error);
        setClaims(null);
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setProfile(null);
            setLoading(false);
            return;
          }
          const parsed = userProfileSchema.safeParse(snapshot.data());
          setProfile(parsed.success ? parsed.data : null);
          setLoading(false);
        },
        (error) => {
          console.error("Failed to load user profile", error);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const refreshClaims = useCallback(async () => {
    if (!user) return;
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    setClaims(tokenResult.claims as AuthClaims);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, claims, profile, loading, refreshClaims }),
    [user, claims, profile, loading, refreshClaims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
