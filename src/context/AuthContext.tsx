import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  signOut,
  RecaptchaVerifier,
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth, db } from '../services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '../domains/auth/types';
import { MOCK_USERS } from '../mockData/auth/mockUsers';
import { isNativeApp } from '../utils/nativeMobile';
import { App } from '@capacitor/app';

export type AuthStatus = 
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'PROFILE_MISSING'
  | 'CLAIMS_MISSING'
  | 'CLAIMS_MISMATCH';

interface AuthContextProps {
  status: AuthStatus;
  currentUser: UserProfile | null;
  phoneNumber: string;
  countryCode: string;
  error: string | null;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  setPhoneNumber: (phone: string) => void;
  submitLogin: (appVerifier: RecaptchaVerifier) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  loginAsRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'dwellora_onboarding_completed';
const USER_STORAGE_KEY = 'dwellora_user';
const ACTIVE_SESSION_KEY = 'dwellora_active_session';
const LAST_ROUTE_KEY = 'dwellora_last_route';
const LAST_ROLE_KEY = 'dwellora_last_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const isSessionActive = typeof window !== 'undefined' && sessionStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
      if (!isSessionActive) {
        // Cold Fresh Launch -> Require login for security
        if (typeof window !== 'undefined') {
          localStorage.removeItem(USER_STORAGE_KEY);
          sessionStorage.removeItem(LAST_ROUTE_KEY);
          sessionStorage.removeItem(LAST_ROLE_KEY);
        }
        return null;
      }
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<AuthStatus>(() => {
    try {
      const isSessionActive = typeof window !== 'undefined' && sessionStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
      if (!isSessionActive) {
        return 'UNAUTHENTICATED';
      }
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
    } catch {
      return 'UNAUTHENTICATED';
    }
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  });
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+91');
  const [error, setError] = useState<string | null>(null);
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // App Lifecycle Detection for Native Mobile Background / Foreground Resume
  useEffect(() => {
    let listenerPromise: any = null;
    if (isNativeApp()) {
      try {
        listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App resumed from background: Verify active session state
            const sessionActive = sessionStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
            const savedUser = localStorage.getItem(USER_STORAGE_KEY);
            if (!sessionActive || !savedUser) {
              // Session expired or killed -> Force login
              logout();
            }
          }
        });
      } catch (e) {
        console.debug('Capacitor App state listener fallback:', e);
      }
    }
    return () => {
      if (listenerPromise) {
        listenerPromise.then((handle: any) => handle && typeof handle.remove === 'function' && handle.remove()).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const isSessionActive = sessionStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (!isSessionActive || !storedUser) {
          setCurrentUser(null);
          setStatus('UNAUTHENTICATED');
        }
        return;
      }

      try {
        const idTokenResult = await firebaseUser.getIdTokenResult(true);
        const claimsRole = (idTokenResult.claims.role as string | undefined)?.toLowerCase() as UserRole | undefined;
        const claimsSocietyId = idTokenResult.claims.societyId as string | undefined;

        if (!claimsRole || !claimsSocietyId) {
          console.error("Missing Custom Claims:", idTokenResult.claims);
          setStatus('CLAIMS_MISSING');
          return;
        }

        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setStatus('PROFILE_MISSING');
          return;
        }

        const profileData = docSnap.data();
        const profile: UserProfile = {
          id: docSnap.id,
          uid: firebaseUser.uid,
          name: profileData.name || '',
          phone: profileData.phone || firebaseUser.phoneNumber || '',
          email: profileData.email || firebaseUser.email || undefined,
          role: (profileData.role || '').toLowerCase() as UserRole,
          societyId: profileData.societyId || '',
          societyName: profileData.societyName,
          flatNumber: profileData.flatNumber,
          flatDetails: profileData.flatDetails,
          unitId: profileData.unitId,
          status: profileData.status || 'ACTIVE',
          avatarUrl: profileData.avatarUrl,
          designation: profileData.designation,
          statusBadge: profileData.statusBadge,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt
        };

        if (profile.role !== claimsRole || profile.societyId !== claimsSocietyId) {
          console.error("Claims mismatch:", { 
            claims: { role: claimsRole, societyId: claimsSocietyId }, 
            profile: { role: profile.role, societyId: profile.societyId } 
          });
          setStatus('CLAIMS_MISMATCH');
          return;
        }

        sessionStorage.setItem(ACTIVE_SESSION_KEY, 'true');
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        setCurrentUser(profile);
        setStatus('AUTHENTICATED');

      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to verify user identity.");
        setStatus('UNAUTHENTICATED');
      }
    });

    return () => unsubscribe();
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
  };

  const submitLogin = async (appVerifier: RecaptchaVerifier) => {
    try {
      setError(null);
      const fullNumber = countryCode + phoneNumber;
      const result = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
      throw err;
    }
  };

  const verifyOtp = async (code: string) => {
    if (!confirmationResult) {
      setError("No pending OTP request.");
      return;
    }
    try {
      setError(null);
      await confirmationResult.confirm(code);
      sessionStorage.setItem(ACTIVE_SESSION_KEY, 'true');
    } catch (err: any) {
      setError(err.message || "Invalid OTP code.");
      throw err;
    }
  };

  const loginAsRole = (role: UserRole) => {
    const user = MOCK_USERS[role] || MOCK_USERS.resident;
    try {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, 'true');
      sessionStorage.setItem(LAST_ROLE_KEY, role.toLowerCase());
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to persist active session:", e);
    }
    setCurrentUser(user);
    setStatus('AUTHENTICATED');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
    try {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      sessionStorage.removeItem(LAST_ROUTE_KEY);
      sessionStorage.removeItem(LAST_ROLE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {}
    setCurrentUser(null);
    setStatus('UNAUTHENTICATED');
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        currentUser,
        phoneNumber,
        countryCode,
        error,
        hasCompletedOnboarding,
        completeOnboarding,
        setPhoneNumber,
        submitLogin,
        verifyOtp,
        loginAsRole,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
