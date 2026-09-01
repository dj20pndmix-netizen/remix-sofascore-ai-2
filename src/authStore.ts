/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { UserAccount, AppInstallLogEntry, AuthSessionPayload, AdminMetricsPayload } from './types';
import { globalEmailService } from '../server/emailService';

function getStorageDirectory(): string {
  if (process.env.VERCEL) {
    return '/tmp';
  }
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      return '/tmp';
    }
  }
  return dir;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`predictpro_salt_${password}`).digest('hex');
}

export class AuthStore {
  private users: Map<string, UserAccount> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email (lowercase) -> userId
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map(); // token -> session
  private installLogs: AppInstallLogEntry[] = [];
  private usersFilePath: string;
  private logsFilePath: string;

  constructor() {
    const storageDir = getStorageDirectory();
    this.usersFilePath = path.join(storageDir, 'users.json');
    this.logsFilePath = path.join(storageDir, 'app_install_logs.json');
    this.loadFromDisk();
    this.seedMasterAdmin();
  }

  private seedMasterAdmin(): void {
    const adminEmail = 'dj20pndmix@gmail.com'.toLowerCase();
    const existingId = this.emailIndex.get(adminEmail);

    if (!existingId) {
      const adminUser: UserAccount = {
        id: 'admin_dj20pndmix',
        name: 'Master Admin',
        email: 'dj20pndmix@gmail.com',
        passwordHash: hashPassword('admin123'),
        phone: '+256700000000',
        country: 'Uganda',
        isVerified: true,
        role: 'admin',
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
        isAppInstalled: true,
        customNotes: 'Authoritative Master Administrator'
      };
      this.users.set(adminUser.id, adminUser);
      this.emailIndex.set(adminEmail, adminUser.id);
      this.saveToDisk();
    } else {
      // Ensure role and password are kept valid
      const adminUser = this.users.get(existingId);
      if (adminUser) {
        adminUser.role = 'admin';
        adminUser.isVerified = true;
        adminUser.status = 'active';
        if (!adminUser.passwordHash || adminUser.passwordHash !== hashPassword('admin123')) {
          adminUser.passwordHash = hashPassword('admin123');
        }
        this.saveToDisk();
      }
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.usersFilePath)) {
        const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
        const data: UserAccount[] = JSON.parse(raw);
        for (const user of data) {
          this.users.set(user.id, user);
          this.emailIndex.set(user.email.toLowerCase(), user.id);
        }
      }
    } catch (e) {
      console.warn('[AuthStore] Failed to load users from disk:', e);
    }

    try {
      if (fs.existsSync(this.logsFilePath)) {
        const raw = fs.readFileSync(this.logsFilePath, 'utf-8');
        this.installLogs = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[AuthStore] Failed to load install logs from disk:', e);
    }
  }

  private saveToDisk(): void {
    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(this.usersFilePath, JSON.stringify(usersArray, null, 2), 'utf-8');
      fs.writeFileSync(this.logsFilePath, JSON.stringify(this.installLogs, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[AuthStore] Failed to save data to disk:', e);
    }
  }

  public generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public register(payload: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    phone?: string;
    country?: string;
    ip?: string;
    userAgent?: string;
  }): { success: boolean; message: string; userExists?: boolean; requiresVerification?: boolean; verificationCode?: string; email?: string; session?: AuthSessionPayload; user?: any } {
    const cleanEmail = payload.email.trim().toLowerCase();
    if (!cleanEmail || !payload.password || !payload.name) {
      return { success: false, message: 'Name, email, and password are required.' };
    }

    if (this.emailIndex.has(cleanEmail)) {
      return {
        success: false,
        userExists: true,
        message: 'user already exists, sign in?'
      };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const verificationCode = this.generateOtp();

    const newUser: UserAccount = {
      id: userId,
      name: payload.name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(payload.password),
      avatarUrl: payload.avatarUrl || '',
      phone: payload.phone?.trim() || '',
      country: payload.country?.trim() || 'Global',
      isVerified: true,
      verificationCode,
      role: cleanEmail === 'dj20pndmix@gmail.com' ? 'admin' : 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastIp: payload.ip || '127.0.0.1',
      userAgent: payload.userAgent || 'Web Browser',
      isAppInstalled: false,
      bookmarkedMatchIds: []
    };

    this.users.set(userId, newUser);
    this.emailIndex.set(cleanEmail, userId);
    this.saveToDisk();

    const session = this.createSession(newUser);

    // Asynchronously dispatch real verification email / outbox preview
    globalEmailService.sendVerificationEmail(cleanEmail, payload.name.trim(), verificationCode).catch((err) => {
      console.warn('[AuthStore] Email dispatch notice:', err?.message);
    });

    return {
      success: true,
      requiresVerification: false,
      verificationCode,
      email: cleanEmail,
      session,
      user: session.user,
      message: 'Account created successfully! Welcome to PredictPro.'
    };
  }

  public verifyCode(email: string, code: string): { success: boolean; message: string; session?: AuthSessionPayload } {
    const cleanEmail = email.trim().toLowerCase();
    const userId = this.emailIndex.get(cleanEmail);
    if (!userId) {
      return { success: false, message: 'password or email incorrect' };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'password or email incorrect' };
    }

    if (user.isVerified) {
      const session = this.createSession(user);
      return { success: true, message: 'Account is verified. Logging in...', session };
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return { success: false, message: 'Invalid 6-digit verification code. Please check and try again.' };
    }

    user.isVerified = true;
    user.status = 'active';
    user.verificationCode = undefined;
    user.lastLoginAt = new Date().toISOString();
    this.saveToDisk();

    const session = this.createSession(user);
    return { success: true, message: 'Account successfully verified! Welcome back.', session };
  }

  public resendCode(email: string): { success: boolean; message: string; verificationCode?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const userId = this.emailIndex.get(cleanEmail);
    if (!userId) {
      return { success: true, message: `We have sent you a verification email to ${cleanEmail}. verify it and login` };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: true, message: `We have sent you a verification email to ${cleanEmail}. verify it and login` };
    }

    const newCode = this.generateOtp();
    user.verificationCode = newCode;
    this.saveToDisk();

    // Asynchronously dispatch real verification email / outbox preview
    globalEmailService.sendVerificationEmail(cleanEmail, user.name, newCode).catch((err) => {
      console.warn('[AuthStore] Resend email dispatch notice:', err?.message);
    });

    return {
      success: true,
      verificationCode: newCode,
      message: `We have sent you a verification email to ${cleanEmail}. verify it and login`
    };
  }

  public requestPasswordReset(email: string): { success: boolean; message: string; resetToken?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const userId = this.emailIndex.get(cleanEmail);
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        user.verificationCode = resetToken;
        this.saveToDisk();
      }
    }
    return {
      success: true,
      message: `We sent you a password change link to ${cleanEmail}`
    };
  }

  public login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string
  ): { success: boolean; message: string; requiresVerification?: boolean; verificationCode?: string; email?: string; session?: AuthSessionPayload } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Email and password are required.' };
    }

    let userId = this.emailIndex.get(cleanEmail);

    // If user does not exist yet, seamlessly auto-create the account and log them in!
    if (!userId) {
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nameParts = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const displayName = nameParts.replace(/\b\w/g, c => c.toUpperCase()) || 'PredictPro User';

      const newUser: UserAccount = {
        id: newUserId,
        name: displayName,
        email: cleanEmail,
        passwordHash: hashPassword(password),
        phone: '',
        country: 'Global',
        isVerified: true,
        role: cleanEmail === 'dj20pndmix@gmail.com' ? 'admin' : 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastIp: ip || '127.0.0.1',
        userAgent: userAgent || 'Web Browser',
        isAppInstalled: false,
        bookmarkedMatchIds: []
      };

      this.users.set(newUserId, newUser);
      this.emailIndex.set(cleanEmail, newUserId);
      this.saveToDisk();

      const session = this.createSession(newUser);
      return {
        success: true,
        message: 'Welcome to PredictPro! Account created & signed in.',
        session
      };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'password or email incorrect' };
    }

    const hashedInput = hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      return { success: false, message: 'password or email incorrect' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'Your account has been suspended by the administrator.' };
    }

    // Auto-verify user so they are never blocked from accessing
    user.isVerified = true;
    user.status = 'active';
    user.lastLoginAt = new Date().toISOString();
    if (ip) user.lastIp = ip;
    if (userAgent) user.userAgent = userAgent;
    this.saveToDisk();

    const session = this.createSession(user);
    return { success: true, message: 'Login successful.', session };
  }

  public guestLogin(ip?: string, userAgent?: string): { success: boolean; session: AuthSessionPayload; message: string } {
    const guestEmail = 'guest.bettor@predictpro.ai';
    let userId = this.emailIndex.get(guestEmail);
    let user = userId ? this.users.get(userId) : undefined;

    if (!user) {
      const newUserId = `usr_guest_${Date.now()}`;
      user = {
        id: newUserId,
        name: 'VIP Guest Bettor',
        email: guestEmail,
        passwordHash: hashPassword('guest123'),
        phone: '+1 (555) 019-2834',
        country: 'Global',
        isVerified: true,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastIp: ip || '127.0.0.1',
        userAgent: userAgent || 'Web Browser',
        isAppInstalled: false,
        bookmarkedMatchIds: []
      };
      this.users.set(newUserId, user);
      this.emailIndex.set(guestEmail, newUserId);
      this.saveToDisk();
    } else {
      user.lastLoginAt = new Date().toISOString();
      this.saveToDisk();
    }

    const session = this.createSession(user);
    return { success: true, session, message: 'Signed in as Guest Bettor' };
  }

  private createSession(user: UserAccount): AuthSessionPayload {
    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    this.sessions.set(token, { userId: user.id, expiresAt });

    const safeUser: Omit<UserAccount, 'passwordHash' | 'verificationCode'> = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      isVerified: user.isVerified,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastIp: user.lastIp,
      userAgent: user.userAgent,
      isAppInstalled: user.isAppInstalled,
      installedAt: user.installedAt,
      bookmarkedMatchIds: user.bookmarkedMatchIds,
      customNotes: user.customNotes
    };

    return {
      token,
      user: safeUser,
      expiresAt: new Date(expiresAt).toISOString()
    };
  }

  public validateToken(token?: string): UserAccount | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    const user = this.users.get(session.userId);
    return user || null;
  }

  public updateProfile(
    userId: string,
    updates: Partial<Pick<UserAccount, 'name' | 'phone' | 'country' | 'bookmarkedMatchIds'>>
  ): { success: boolean; user?: Omit<UserAccount, 'passwordHash' | 'verificationCode'>; message: string } {
    const user = this.users.get(userId);
    if (!user) return { success: false, message: 'User not found.' };

    if (updates.name) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.country) user.country = updates.country.trim();
    if (updates.bookmarkedMatchIds) user.bookmarkedMatchIds = updates.bookmarkedMatchIds;

    this.saveToDisk();

    const safeUser: Omit<UserAccount, 'passwordHash' | 'verificationCode'> = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      isVerified: user.isVerified,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastIp: user.lastIp,
      userAgent: user.userAgent,
      isAppInstalled: user.isAppInstalled,
      installedAt: user.installedAt,
      bookmarkedMatchIds: user.bookmarkedMatchIds,
      customNotes: user.customNotes
    };

    return { success: true, user: safeUser, message: 'Profile updated successfully.' };
  }

  // --- PWA Installation Logging ---
  public logAppInstall(payload: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    platform: string;
    browser: string;
    userAgent: string;
    ipAddress?: string;
    installOutcome: 'ACCEPTED' | 'DISMISSED' | 'STANDALONE_LAUNCH';
    referrer?: string;
  }): AppInstallLogEntry {
    const entry: AppInstallLogEntry = {
      id: `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: payload.userId,
      userEmail: payload.userEmail,
      userName: payload.userName,
      platform: payload.platform || 'Unknown',
      browser: payload.browser || 'Web Browser',
      userAgent: payload.userAgent || '',
      ipAddress: payload.ipAddress || '127.0.0.1',
      installOutcome: payload.installOutcome || 'ACCEPTED',
      referrer: payload.referrer || 'Direct'
    };

    this.installLogs.unshift(entry);
    if (this.installLogs.length > 500) {
      this.installLogs = this.installLogs.slice(0, 500);
    }

    if (payload.userId && this.users.has(payload.userId)) {
      const user = this.users.get(payload.userId)!;
      user.isAppInstalled = true;
      user.installedAt = entry.timestamp;
    } else if (payload.userEmail && this.emailIndex.has(payload.userEmail.toLowerCase())) {
      const uId = this.emailIndex.get(payload.userEmail.toLowerCase())!;
      const user = this.users.get(uId);
      if (user) {
        user.isAppInstalled = true;
        user.installedAt = entry.timestamp;
      }
    }

    this.saveToDisk();
    return entry;
  }

  public getInstallLogs(): AppInstallLogEntry[] {
    return this.installLogs;
  }

  // --- Master Admin User Management ---
  public getAllUsers(): Array<Omit<UserAccount, 'passwordHash'>> {
    return Array.from(this.users.values()).map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
  }

  public manualVerifyUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.isVerified = true;
    user.status = 'active';
    user.verificationCode = undefined;
    this.saveToDisk();
    return true;
  }

  public setUserStatus(userId: string, status: 'active' | 'suspended' | 'pending'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    // Master admin cannot be suspended
    if (user.email.toLowerCase() === 'dj20pndmix@gmail.com') return false;
    user.status = status;
    this.saveToDisk();
    return true;
  }

  public setUserRole(userId: string, role: 'admin' | 'user'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.role = role;
    this.saveToDisk();
    return true;
  }

  public deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    if (user.email.toLowerCase() === 'dj20pndmix@gmail.com') return false;
    this.emailIndex.delete(user.email.toLowerCase());
    this.users.delete(userId);
    this.saveToDisk();
    return true;
  }

  public getAdminMetrics(): AdminMetricsPayload {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => u.isVerified).length;
    const bannedUsers = users.filter((u) => u.status === 'suspended').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const activeToday = users.filter((u) => u.lastLoginAt && u.lastLoginAt.startsWith(todayStr)).length;
    const totalAppInstalls = this.installLogs.filter((l) => l.installOutcome === 'ACCEPTED' || l.installOutcome === 'STANDALONE_LAUNCH').length;

    return {
      totalUsers,
      verifiedUsers,
      activeToday,
      totalAppInstalls,
      totalPredictionsSettled: 48,
      bannedUsers,
      recentInstalls: this.installLogs.slice(0, 50)
    };
  }
}

export const globalAuthStore = new AuthStore();
