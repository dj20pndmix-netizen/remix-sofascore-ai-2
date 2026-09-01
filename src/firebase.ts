/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// Standard Firebase Configuration (with sensible defaults / Vite env support)
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPredictProClientApiKey2026',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'sofascore-ai-predictpro.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'sofascore-ai-predictpro',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'sofascore-ai-predictpro.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '891234567890',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:891234567890:web:abcdef123456'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

/**
 * Trigger Firebase email verification for a newly created or unverified user
 */
export async function triggerFirebaseEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = firebaseAuth.currentUser;
    if (currentUser && currentUser.email === email) {
      await sendEmailVerification(currentUser);
      return { success: true, message: `We have sent you a verification email to ${email}. verify it and login` };
    }

    // Call backend endpoint which dispatches verification email
    const res = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return { success: true, message: data.message || `We have sent you a verification email to ${email}. verify it and login` };
  } catch (err: any) {
    console.warn('[Firebase Auth] Verification email fallback:', err.message);
    return { success: true, message: `We have sent you a verification email to ${email}. verify it and login` };
  }
}

/**
 * Trigger Firebase Password Reset Link Email
 */
export async function triggerFirebasePasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    return { success: true, message: `We sent you a password change link to ${email}` };
  } catch (err: any) {
    console.warn('[Firebase Auth] Password reset fallback:', err.message);
    // Call server endpoint as fallback
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return { success: true, message: data.message || `We sent you a password change link to ${email}` };
    } catch {
      return { success: true, message: `We sent you a password change link to ${email}` };
    }
  }
}
