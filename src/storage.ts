// Prisma 数据库存储

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  AssessmentSession,
  AssessmentRecord,
  AssessmentResult,
  Subscription,
  Gender,
  ActivityLevel,
  AssessmentStatus,
} from './types';

let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// ============ Session 操作 ============

export async function createSession(): Promise<AssessmentSession> {
  const session_id = randomUUID().replace(/-/g, '');
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return getPrisma().assessmentSessions.create({
    data: { session_id, expires_at },
  }) as unknown as Promise<AssessmentSession>;
}

export async function getSession(session_id: string): Promise<AssessmentSession | undefined> {
  return getPrisma().assessmentSessions.findUnique({ where: { session_id } }) as unknown as Promise<AssessmentSession | undefined>;
}

// ============ Record 操作 ============

export async function createRecord(session_id: string): Promise<AssessmentRecord> {
  return getPrisma().assessmentRecords.create({
    data: { session_id },
  }) as unknown as Promise<AssessmentRecord>;
}

export async function getRecord(session_id: string): Promise<AssessmentRecord | undefined> {
  return getPrisma().assessmentRecords.findUnique({ where: { session_id } }) as unknown as Promise<AssessmentRecord | undefined>;
}

export async function updateRecord(
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
): Promise<AssessmentRecord | undefined> {
  const current = await getRecord(session_id);
  if (!current) return undefined;

  // current_step 只能前进，不能倒退
  if (data.current_step !== undefined && data.current_step < current.current_step) {
    data.current_step = current.current_step;
  }

  // 乐观锁：版本不匹配则重试一次
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await getPrisma().assessmentRecords.update({
        where: { session_id, version: current.version },
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
          version: current.version + 1,
        },
      }) as unknown as Promise<AssessmentRecord | undefined>;
    } catch (err: unknown) {
      const isVersionError = (err as { code?: string }).code === 'P2034'; // Prisma version conflict
      if (isVersionError && attempt < MAX_RETRIES - 1) {
        // 重新获取最新版本后重试
        const latest = await getRecord(session_id);
        if (!latest) return undefined;
        Object.assign(current, latest);
        continue;
      }
      throw err;
    }
  }
  return undefined;
}

// ============ Result 操作 ============

export async function createResult(
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
): Promise<AssessmentResult> {
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
  }) as unknown as Promise<AssessmentResult>;
}

export async function getResult(session_id: string): Promise<AssessmentResult | undefined> {
  return getPrisma().assessmentResults.findUnique({ where: { session_id } }) as unknown as Promise<AssessmentResult | undefined>;
}

// 幂等 upsert：已存在则返回已有结果，不重复创建
export async function upsertResult(
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
): Promise<AssessmentResult> {
  return getPrisma().assessmentResults.upsert({
    where: { session_id },
    create: {
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
    update: {},
  }) as unknown as Promise<AssessmentResult>;
}

// ============ Subscription 操作 ============

export async function createSubscription(session_id: string): Promise<Subscription> {
  return getPrisma().subscriptions.create({
    data: { session_id, status: 'none' },
  }) as unknown as Promise<Subscription>;
}

export async function getSubscription(session_id: string): Promise<Subscription | undefined> {
  return getPrisma().subscriptions.findUnique({ where: { session_id } }) as unknown as Promise<Subscription | undefined>;
}

export async function activateSubscription(session_id: string): Promise<Subscription | undefined> {
  return getPrisma().subscriptions.update({
    where: { session_id },
    data: { status: 'active', paid_at: new Date(), expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  }) as unknown as Promise<Subscription | undefined>;
}

// ============ 业务逻辑封装 ============

export async function createAssessment(): Promise<AssessmentSession> {
  const session_id = randomUUID().replace(/-/g, '');
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return getPrisma().assessmentSessions.create({
    data: {
      session_id,
      expires_at,
      records: { create: {} },
      subscriptions: { create: { status: 'none' } },
    },
    include: { records: true, subscriptions: true },
  }) as unknown as Promise<AssessmentSession>;
}

export function isRecordComplete(record: AssessmentRecord): boolean {
  return (
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

// 清理过期 session（每小时调用一次）
export async function cleanupExpired(): Promise<number> {
  const result = await getPrisma().assessmentSessions.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
  return result.count;
}
