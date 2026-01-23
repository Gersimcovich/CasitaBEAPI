// User Authentication Library
// Uses file-based storage (can be migrated to a database later)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CasitaUser,
  UserSession,
  VerificationCode,
  UserReservation,
  Locale,
} from '@/types/user';

// Storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CODES_FILE = path.join(DATA_DIR, 'verification-codes.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'user-reservations.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper functions for file operations
function readJsonFile<T>(filePath: string, defaultValue: T[] = []): T[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T[]): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Generate IDs
function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// USER OPERATIONS
// ============================================

export function getUserByEmail(email: string): CasitaUser | null {
  const users = readJsonFile<CasitaUser>(USERS_FILE);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string): CasitaUser | null {
  const users = readJsonFile<CasitaUser>(USERS_FILE);
  return users.find((u) => u.id === id) || null;
}

export function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}): CasitaUser {
  const users = readJsonFile<CasitaUser>(USERS_FILE);

  const newUser: CasitaUser = {
    id: generateId(),
    email: data.email.toLowerCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    country: data.country,
    preferredLanguage: data.preferredLanguage || 'en',
    casitaPoints: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  return newUser;
}

export function updateUser(
  userId: string,
  updates: Partial<Pick<CasitaUser, 'firstName' | 'lastName' | 'phone' | 'country' | 'preferredLanguage'>>
): CasitaUser | null {
  const users = readJsonFile<CasitaUser>(USERS_FILE);
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) return null;

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJsonFile(USERS_FILE, users);
  return users[index];
}

export function addPointsToUser(userId: string, amountSpent: number): CasitaUser | null {
  const users = readJsonFile<CasitaUser>(USERS_FILE);
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) return null;

  const pointsToAdd = Math.floor(amountSpent); // 1 dollar = 1 point
  users[index].casitaPoints += pointsToAdd;
  users[index].totalSpent += amountSpent;
  users[index].updatedAt = new Date().toISOString();

  writeJsonFile(USERS_FILE, users);
  return users[index];
}

// ============================================
// VERIFICATION CODE OPERATIONS
// ============================================

export function createVerificationCode(
  email: string,
  type: 'login' | 'register'
): VerificationCode {
  const codes = readJsonFile<VerificationCode>(CODES_FILE);

  // Invalidate existing codes for this email
  const updatedCodes = codes.filter(
    (c) => c.email.toLowerCase() !== email.toLowerCase() || c.used
  );

  const newCode: VerificationCode = {
    id: generateId(),
    email: email.toLowerCase(),
    code: generate6DigitCode(),
    type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    createdAt: new Date().toISOString(),
    attempts: 0,
    used: false,
  };

  updatedCodes.push(newCode);
  writeJsonFile(CODES_FILE, updatedCodes);

  return newCode;
}

export function verifyCode(
  email: string,
  code: string
): { valid: boolean; error?: string; codeData?: VerificationCode } {
  const codes = readJsonFile<VerificationCode>(CODES_FILE);
  const codeEntry = codes.find(
    (c) =>
      c.email.toLowerCase() === email.toLowerCase() &&
      !c.used &&
      new Date(c.expiresAt) > new Date()
  );

  if (!codeEntry) {
    return { valid: false, error: 'Code expired or not found. Please request a new code.' };
  }

  // Check attempts
  if (codeEntry.attempts >= 5) {
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Update attempts
  const index = codes.findIndex((c) => c.id === codeEntry.id);
  codes[index].attempts += 1;
  writeJsonFile(CODES_FILE, codes);

  if (codeEntry.code !== code) {
    return { valid: false, error: 'Invalid code. Please try again.' };
  }

  // Mark as used
  codes[index].used = true;
  writeJsonFile(CODES_FILE, codes);

  return { valid: true, codeData: codeEntry };
}

// ============================================
// SESSION OPERATIONS
// ============================================

export function createSession(userId: string): UserSession {
  const sessions = readJsonFile<UserSession>(SESSIONS_FILE);

  const newSession: UserSession = {
    id: generateId(),
    userId,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: new Date().toISOString(),
  };

  sessions.push(newSession);
  writeJsonFile(SESSIONS_FILE, sessions);

  return newSession;
}

export function getSessionByToken(token: string): UserSession | null {
  const sessions = readJsonFile<UserSession>(SESSIONS_FILE);
  return (
    sessions.find(
      (s) => s.token === token && new Date(s.expiresAt) > new Date()
    ) || null
  );
}

export function deleteSession(token: string): boolean {
  const sessions = readJsonFile<UserSession>(SESSIONS_FILE);
  const index = sessions.findIndex((s) => s.token === token);

  if (index === -1) return false;

  sessions.splice(index, 1);
  writeJsonFile(SESSIONS_FILE, sessions);
  return true;
}

export function deleteAllUserSessions(userId: string): void {
  const sessions = readJsonFile<UserSession>(SESSIONS_FILE);
  const filtered = sessions.filter((s) => s.userId !== userId);
  writeJsonFile(SESSIONS_FILE, filtered);
}

// ============================================
// RESERVATION OPERATIONS
// ============================================

export function getUserReservations(userId: string): UserReservation[] {
  const reservations = readJsonFile<UserReservation>(RESERVATIONS_FILE);
  return reservations
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addUserReservation(data: Omit<UserReservation, 'id' | 'createdAt'>): UserReservation {
  const reservations = readJsonFile<UserReservation>(RESERVATIONS_FILE);

  const newReservation: UserReservation = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  reservations.push(newReservation);
  writeJsonFile(RESERVATIONS_FILE, reservations);

  return newReservation;
}

export function linkReservationToUser(
  confirmationCode: string,
  userEmail: string
): UserReservation | null {
  // This would be called when a user creates an account after making a reservation
  // to link their past reservations to their account
  const user = getUserByEmail(userEmail);
  if (!user) return null;

  const reservations = readJsonFile<UserReservation>(RESERVATIONS_FILE);
  const index = reservations.findIndex(
    (r) => r.confirmationCode === confirmationCode && !r.userId
  );

  if (index === -1) return null;

  reservations[index].userId = user.id;
  writeJsonFile(RESERVATIONS_FILE, reservations);

  return reservations[index];
}

// Clean up expired codes (call periodically)
export function cleanupExpiredCodes(): number {
  const codes = readJsonFile<VerificationCode>(CODES_FILE);
  const validCodes = codes.filter(
    (c) => !c.used && new Date(c.expiresAt) > new Date()
  );
  const removed = codes.length - validCodes.length;
  writeJsonFile(CODES_FILE, validCodes);
  return removed;
}
