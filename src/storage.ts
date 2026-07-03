// Prisma 数据库存储

import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  AssessmentSession,
  AssessmentRecord,
  AssessmentResult,
  Subscription,
  Gender,
  ActivityLevel,
  AssessmentStatus,
  SubscriptionStatus,
} from './types';

let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// ============ Session 操作 ============

export function createSession(): AssessmentSession {
  const session_id = randomUUID().replace(/-/g, '');
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = getPrisma().assessmentSessions.create({
    data: { session_id, expires_at },
  });
  return session as unknown as AssessmentSession;
}

export function getSession(session_id: string): AssessmentSession | undefined {
  return getPrisma().assessmentSessions.findUnique({ where: { session_id } }) as unknown as AssessmentSession | undefined;
}

// ============ Record 操作 ============

export function createRecord(session_id: string): AssessmentRecord {
  return getPrisma().assessmentRecords.create({
    data: { session_id },
  }) as unknown as AssessmentRecord;
}

export function getRecord(session_id: string): AssessmentRecord | undefined {
  return getPrisma().assessmentRecords.findUnique({ where: { session_id } }) as unknown as AssessmentRecord | undefined;
}

export function updateRecord(
  session_id: string,
  data: Partial<{
    gender: Gender | null;
    goal: string | null;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    target_weight_kg: number | null;
    activity_level: ActivityLevel | null;
    current_step: number;
    status: AssessmentStatus;
  }>
): AssessmentRecord | undefined {
  return getPrisma().assessmentRecords.update({
    where: { session_id },
    data: {
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.height_cm !== undefined && { height_cm: data.height_cm }),
      ...(data.weight_kg !== undefined && { weight_kg: data.weight_kg }),
      ...(data.target_weight_kg !== undefined && { target_weight_kg: data.target_weight_kg }),
      ...(data.activity_level !== undefined && { activity_level: data.activity_level }),
      ...(data.current_step !== undefined && { current_step: data.current_step }),
      ...(data.status !== undefined && { status: data.status }),
    },
  }) as unknown as AssessmentRecord | undefined;
}

// ============ Result 操作 ============

export function createResult(
  session_id: string,
  data: {
    bmi: number;
    bmi_category: string;
    bmr: number;
    tdee: number;
    recommended_intake_kcal: number;
    target_date: Date;
    weekly_targets: number[];
    health_risks: string[];
    exercise_advice: string;
    macros: { protein_g: number; carbs_g: number; fat_g: number };
  }
): AssessmentResult {
  return getPrisma().assessmentResults.create({
    data: {
      session_id,
      bmi: data.bmi,
      bmi_category: data.bmi_category,
      bmr: data.bmr,
      tdee: data.tdee,
      recommended_kcal: data.recommended_intake_kcal,
      target_date: data.target_date,
      weekly_targets: data.weekly_targets,
      health_risks: data.health_risks,
      exercise_advice: data.exercise_advice,
      macros: data.macros,
    },
  }) as unknown as AssessmentResult;
}

export function getResult(session_id: string): AssessmentResult | undefined {
  return getPrisma().assessmentResults.findUnique({ where: { session_id } }) as unknown as AssessmentResult | undefined;
}

// ============ Subscription 操作 ============

export function createSubscription(session_id: string): Subscription {
  return getPrisma().subscriptions.create({
    data: { session_id, status: 'none' },
  }) as unknown as Subscription;
}

export function getSubscription(session_id: string): Subscription | undefined {
  return getPrisma().subscriptions.findUnique({ where: { session_id } }) as unknown as Subscription | undefined;
}

export function activateSubscription(session_id: string): Subscription | undefined {
  return getPrisma().subscriptions.update({
    where: { session_id },
    data: { status: 'active', expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  }) as unknown as Subscription | undefined;
}

// ============ 业务逻辑封装 ============

export function createAssessment(): AssessmentSession {
  const session_id = randomUUID().replace(/-/g, '');
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return getPrisma().assessmentSessions.create({
    data: {
      session_id,
      expires_at,
      records: { create: { session_id } },
      subscriptions: { create: { session_id, status: 'none' } },
    },
    include: { records: true, subscriptions: true },
  }) as unknown as AssessmentSession;
}

export function isRecordComplete(record: AssessmentRecord): boolean {
  return (
    record.gender !== null &&
    record.goal !== null &&
    record.age !== null &&
    record.height_cm !== null &&
    record.weight_kg !== null &&
    record.target_weight_kg !== null &&
    record.activity_level !== null
  );
}

// ============ 测试辅助 ============

export async function clearAllData(): Promise<void> {
  await getPrisma().assessmentResults.deleteMany();
  await getPrisma().assessmentRecords.deleteMany();
  await getPrisma().subscriptions.deleteMany();
  await getPrisma().assessmentSessions.deleteMany();
}

export async function disconnectPrisma(): Promise<void> {
  await getPrisma().$disconnect();
}
