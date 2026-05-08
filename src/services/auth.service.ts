import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type ActionCodeSettings,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  emailVerified?: boolean;
  avatar?: string;
}

const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

const getActionSettings = (path: string): ActionCodeSettings => ({
  url: `${appUrl}${path}`,
  handleCodeInApp: false,
});

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toAuthErrorMessage = (error: unknown, fallback: string): string => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please try again in a few minutes.';
  }

  if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
    return 'This link is invalid or expired. Please request a new one.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'Email already use';
  }

  return fallback;
};

const mapFirebaseUser = async (firebaseUser: FirebaseUser): Promise<{ user: AuthUser; accessToken: string }> => {
  const tokenResult = await firebaseUser.getIdTokenResult();
  const role = (tokenResult.claims.role as AuthUser['role'] | undefined) || 'CUSTOMER';
  const user: AuthUser = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    role,
    emailVerified: firebaseUser.emailVerified,
    avatar: firebaseUser.photoURL || undefined,
  };

  return {
    user,
    accessToken: await firebaseUser.getIdToken(),
  };
};

export const authService = {
  async login(credentials: Credentials) {
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        normalizeEmail(credentials.email),
        credentials.password,
      );
      const auth = await mapFirebaseUser(credential.user);
      useAuthStore.getState().setAuth(auth.user, auth.accessToken);
      return auth;
    } catch (error: unknown) {
      throw new Error(toAuthErrorMessage(error, 'Unable to sign in right now.'));
    }
  },

  async register(data: RegisterData) {
    try {
      const normalizedEmail = normalizeEmail(data.email);

      // 1. Check if email is available in MongoDB
      const checkRes = await fetch(`${apiUrl}/auth/firebase/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!checkRes.ok) {
        if (checkRes.status === 409) {
          throw new Error('Email already use');
        }
        throw new Error('Unable to verify email availability.');
      }

      // 2. Create Firebase user (Required for Firebase to send verification email)
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, data.password);
      const firebaseUser = credential.user;

      await updateProfile(firebaseUser, { displayName: data.name });

      // 3. Send Firebase Verification Email
      // NOTE: Firebase will store this user as "unverified" until they click the link.
      // We do NOT call sync-user yet, so MongoDB remains empty.
      await sendEmailVerification(firebaseUser, getActionSettings('/verify-email'));
      
      // 4. Sign out immediately - enforce "no session until verified"
      await signOut(firebaseAuth);
      useAuthStore.getState().clearAuth();

      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === 'Email already use')) {
        throw error;
      }
      throw new Error(toAuthErrorMessage(error, 'Registration failed. Please try again.'));
    }
  },

  async verifyEmail(oobCode: string) {
    try {
      // 1. Apply Firebase action code
      await applyActionCode(firebaseAuth, oobCode);
      
      // After applying, the email is verified in Firebase Auth.
      // The MongoDB record will be created automatically when the user first logs in 
      // via the JwtAuthGuard auto-sync mechanism.
      
      return { message: 'Email verified successfully. You can now login.' };
    } catch (error: unknown) {
      throw new Error(toAuthErrorMessage(error, 'Verification link is invalid or expired.'));
    }
  },

  async syncAfterVerification(firebaseUser: FirebaseUser) {
    // This is a helper to finalize MongoDB record after verification
    try {
      const res = await fetch(`${apiUrl}/auth/firebase/sync-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
        }),
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to sync after verification:', error);
    }
  },

  async resendVerificationEmail() {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to resend verification email.');
    }

    await sendEmailVerification(currentUser, getActionSettings('/verify-email'));
    return { message: 'Verification email sent.' };
  },

  async forgotPassword(email: string) {
    try {
      const normalizedEmail = normalizeEmail(email);
      const validateRes = await fetch(`${apiUrl}/auth/firebase/validate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!validateRes.ok) {
        throw new Error('No account found with this email.');
      }

      await sendPasswordResetEmail(firebaseAuth, normalizedEmail, getActionSettings('/reset-password'));
      return { message: 'Password reset email sent.' };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'No account found with this email.') {
        throw error;
      }

      throw new Error(toAuthErrorMessage(error, 'Failed to send reset email. Please try again.'));
    }
  },

  async resetPassword(oobCode: string, newPassword: string) {
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      return { message: 'Password updated successfully.' };
    } catch (error: unknown) {
      throw new Error(toAuthErrorMessage(error, 'Reset link is invalid or expired.'));
    }
  },


  async logout() {
    await signOut(firebaseAuth);
    useAuthStore.getState().logout();
  },

  async sendSignInLink(email: string) {
    await sendSignInLinkToEmail(firebaseAuth, email, getActionSettings('/login'));
    return { message: 'Sign-in link sent.' };
  },
};

export type { AuthUser };
