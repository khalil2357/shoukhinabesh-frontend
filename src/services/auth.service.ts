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
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, data.password);
      const firebaseUser = credential.user;

      await updateProfile(firebaseUser, { displayName: data.name });

      const syncRes = await fetch(`${apiUrl}/auth/firebase/sync-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name,
          emailVerified: firebaseUser.emailVerified,
        }),
      });

      if (!syncRes.ok) {
        // Keep Firebase and MongoDB consistent: rollback Firebase user if Mongo sync fails.
        await firebaseUser.delete();
        throw new Error('Unable to create account right now. Please try again.');
      }

      await sendEmailVerification(firebaseUser, getActionSettings('/verify-email'));
      await signOut(firebaseAuth);
      useAuthStore.getState().clearAuth();
      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error: unknown) {
      throw new Error(toAuthErrorMessage(error, 'Registration failed. Please try again.'));
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

  async verifyEmail(oobCode: string) {
    await applyActionCode(firebaseAuth, oobCode);
    return { message: 'Email verified successfully.' };
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
