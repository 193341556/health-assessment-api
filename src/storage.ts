// 内存数据存储 - 实现 Prisma 类似的接口

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

// 内存数据库
const sessions: Map<string, AssessmentSession> = new Map();
const records: Map<string, AssessmentRecord> = new Map();
const results: Map<string, AssessmentResult> = new Map();
const subscriptions: Map<string, Subscription> = new Map();

// 会话过期时间：24小时
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// 定期清理过期会话（每100次操作触发一次）
let operationCounter = 0;
function cleanupExpiredSessions(): void {
  operationCounter++;
  if (operationCounter % 100 !== 0) return;

  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.created_at.getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
      records.delete(id);
      results.delete(id);
      subscriptions.delete(id);
    }
  }
}

// ============ Session 操作 ============

export function createSession(): AssessmentSession {
  cleanupExpiredSessions();
  const session_id = randomUUID().replace(/-/g, '');
  const session: AssessmentSession = {
    session_id,
    created_at: new Date(),
  };
  sessions.set(session_id, session);
  return session;
}

export function getSession(session_id: string): AssessmentSession | undefined {
  return sessions.get(session_id);
}

// ============ Record 操作 ============

export function createRecord(session_id: string): AssessmentRecord {
  const record: AssessmentRecord = {
    session_id,
    gender: null,
    goal: null,
    age: null,
    height_cm: null,
    weight_kg: null,
    target_weight_kg: null,
    activity_level: null,
    current_step: 0,
    status: 'draft',
    updated_at: new Date(),
  };
  records.set(session_id, record);
  return record;
}

export function getRecord(session_id: string): AssessmentRecord | undefined {
  return records.get(session_id);
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
  const record = records.get(session_id);
  if (!record) return undefined;
  cleanupExpiredSessions();

  // 只更新传入的字段
  if (data.gender !== undefined) record.gender = data.gender;
  if (data.goal !== undefined) record.goal = data.goal;
  if (data.age !== undefined) record.age = data.age;
  if (data.height_cm !== undefined) record.height_cm = data.height_cm;
  if (data.weight_kg !== undefined) record.weight_kg = data.weight_kg;
  if (data.target_weight_kg !== undefined) record.target_weight_kg = data.target_weight_kg;
  if (data.activity_level !== undefined) record.activity_level = data.activity_level;

  // current_step 只前进不倒退
  if (data.current_step !== undefined) {
    record.current_step = Math.max(record.current_step, data.current_step);
  }

  // status 可以更新
  if (data.status !== undefined) {
    record.status = data.status;
  }

  record.updated_at = new Date();
  return record;
}

// ============ Result 操作 ============

export function createResult(
  session_id: string,
  data: { bmi: number; recommended_intake_kcal: number; target_date: Date }
): AssessmentResult {
  const result: AssessmentResult = {
    session_id,
    ...data,
    computed_at: new Date(),
  };
  results.set(session_id, result);
  return result;
}

export function getResult(session_id: string): AssessmentResult | undefined {
  return results.get(session_id);
}

// ============ Subscription 操作 ============

export function createSubscription(session_id: string): Subscription {
  const subscription: Subscription = {
    session_id,
    status: 'inactive',
    paid_at: null,
  };
  subscriptions.set(session_id, subscription);
  return subscription;
}

export function getSubscription(session_id: string): Subscription | undefined {
  return subscriptions.get(session_id);
}

export function activateSubscription(session_id: string): Subscription | undefined {
  const subscription = subscriptions.get(session_id);
  if (!subscription) return undefined;

  subscription.status = 'active';
  subscription.paid_at = new Date();
  return subscription;
}

// ============ 业务逻辑封装 ============

export function createAssessment(): AssessmentSession {
  const session = createSession();
  createRecord(session.session_id);
  createSubscription(session.session_id);
  return session;
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

export function clearAllData(): void {
  sessions.clear();
  records.clear();
  results.clear();
  subscriptions.clear();
}