// User Authentication Library
// Uses MongoDB for persistent storage

import crypto from 'crypto';
import { getDatabase } from './mongodb';
import {
  CasitaUser,
  UserSession,
  VerificationCode,
  UserReservation,
  Locale,
} from '@/types/user';

// Collection names
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const CODES_COLLECTION = 'verification_codes';
const RESERVATIONS_COLLECTION = 'user_reservations';

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

export async function getUserByEmail(email: string): Promise<CasitaUser | null> {
  const db = await getDatabase();
  const user = await db.collection<CasitaUser>(USERS_COLLECTION).findOne({
    email: email.toLowerCase(),
  });
  return user;
}

export async function getUserById(id: string): Promise<CasitaUser | null> {
  const db = await getDatabase();
  const user = await db.collection<CasitaUser>(USERS_COLLECTION).findOne({ id });
  return user;
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}): Promise<CasitaUser> {
  const db = await getDatabase();

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

  await db.collection<CasitaUser>(USERS_COLLECTION).insertOne(newUser);
  return newUser;
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<CasitaUser, 'firstName' | 'lastName' | 'phone' | 'country' | 'preferredLanguage'>>
): Promise<CasitaUser | null> {
  const db = await getDatabase();

  const result = await db.collection<CasitaUser>(USERS_COLLECTION).findOneAndUpdate(
    { id: userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

export async function addPointsToUser(userId: string, amountSpent: number): Promise<CasitaUser | null> {
  const db = await getDatabase();
  const pointsToAdd = Math.floor(amountSpent); // 1 dollar = 1 point

  const result = await db.collection<CasitaUser>(USERS_COLLECTION).findOneAndUpdate(
    { id: userId },
    {
      $inc: {
        casitaPoints: pointsToAdd,
        totalSpent: amountSpent,
      },
      $set: {
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

// ============================================
// VERIFICATION CODE OPERATIONS
// ============================================

export async function createVerificationCode(
  email: string,
  type: 'login' | 'register'
): Promise<VerificationCode> {
  const db = await getDatabase();

  // Invalidate existing codes for this email
  await db.collection<VerificationCode>(CODES_COLLECTION).updateMany(
    { email: email.toLowerCase(), used: false },
    { $set: { used: true } }
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

  await db.collection<VerificationCode>(CODES_COLLECTION).insertOne(newCode);
  return newCode;
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string; codeData?: VerificationCode }> {
  const db = await getDatabase();

  const codeEntry = await db.collection<VerificationCode>(CODES_COLLECTION).findOne({
    email: email.toLowerCase(),
    used: false,
    expiresAt: { $gt: new Date().toISOString() },
  });

  if (!codeEntry) {
    return { valid: false, error: 'Code expired or not found. Please request a new code.' };
  }

  // Check attempts
  if (codeEntry.attempts >= 5) {
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Increment attempts
  await db.collection<VerificationCode>(CODES_COLLECTION).updateOne(
    { id: codeEntry.id },
    { $inc: { attempts: 1 } }
  );

  if (codeEntry.code !== code) {
    return { valid: false, error: 'Invalid code. Please try again.' };
  }

  // Mark as used
  await db.collection<VerificationCode>(CODES_COLLECTION).updateOne(
    { id: codeEntry.id },
    { $set: { used: true } }
  );

  return { valid: true, codeData: codeEntry };
}

// ============================================
// SESSION OPERATIONS
// ============================================

export async function createSession(userId: string): Promise<UserSession> {
  const db = await getDatabase();

  const newSession: UserSession = {
    id: generateId(),
    userId,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: new Date().toISOString(),
  };

  await db.collection<UserSession>(SESSIONS_COLLECTION).insertOne(newSession);
  return newSession;
}

export async function getSessionByToken(token: string): Promise<UserSession | null> {
  const db = await getDatabase();

  const session = await db.collection<UserSession>(SESSIONS_COLLECTION).findOne({
    token,
    expiresAt: { $gt: new Date().toISOString() },
  });

  return session;
}

export async function deleteSession(token: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.collection<UserSession>(SESSIONS_COLLECTION).deleteOne({ token });
  return result.deletedCount > 0;
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<UserSession>(SESSIONS_COLLECTION).deleteMany({ userId });
}

// ============================================
// RESERVATION OPERATIONS
// ============================================

export async function getUserReservations(userId: string): Promise<UserReservation[]> {
  const db = await getDatabase();

  const reservations = await db
    .collection<UserReservation>(RESERVATIONS_COLLECTION)
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return reservations;
}

export async function addUserReservation(
  data: Omit<UserReservation, 'id' | 'createdAt'>
): Promise<UserReservation> {
  const db = await getDatabase();

  const newReservation: UserReservation = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  await db.collection<UserReservation>(RESERVATIONS_COLLECTION).insertOne(newReservation);
  return newReservation;
}

export async function linkReservationToUser(
  confirmationCode: string,
  userEmail: string
): Promise<UserReservation | null> {
  const user = await getUserByEmail(userEmail);
  if (!user) return null;

  const db = await getDatabase();

  const result = await db.collection<UserReservation>(RESERVATIONS_COLLECTION).findOneAndUpdate(
    { confirmationCode, userId: { $exists: false } },
    { $set: { userId: user.id } },
    { returnDocument: 'after' }
  );

  return result;
}

// Clean up expired codes (call periodically)
export async function cleanupExpiredCodes(): Promise<number> {
  const db = await getDatabase();

  const result = await db.collection<VerificationCode>(CODES_COLLECTION).deleteMany({
    $or: [
      { used: true },
      { expiresAt: { $lte: new Date().toISOString() } },
    ],
  });

  return result.deletedCount;
}
