// 核心类型定义

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type AssessmentStatus = 'draft' | 'completed';
export type SubscriptionStatus = 'inactive' | 'active';

// 会话表
export interface AssessmentSession {
  session_id: string; // uuid4 hex, 32 chars
  created_at: Date;
}

// 测评记录表
export interface AssessmentRecord {
  session_id: string;
  gender: Gender | null;
  goal: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: ActivityLevel | null;
  current_step: number;
  status: AssessmentStatus;
  updated_at: Date;
}

// 测评结果表
export interface AssessmentResult {
  session_id: string;
  bmi: number;
  recommended_intake_kcal: number;
  target_date: Date;
  computed_at: Date;
}

// 订阅表
export interface Subscription {
  session_id: string;
  status: SubscriptionStatus;
  paid_at: Date | null;
}

// API 请求/响应类型
export interface CreateAssessmentResponse {
  session_id: string;
  current_step: number;
}

export interface UpdateAssessmentRequest {
  gender?: Gender;
  goal?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  activity_level?: ActivityLevel;
  current_step?: number;
}

export interface GetAssessmentResponse extends AssessmentRecord {
  // 继承 AssessmentRecord 的所有字段
}

export interface SubmitAssessmentResponse {
  session_id: string;
  status: AssessmentStatus;
  computed_at: Date;
}

// 差异化结果
export interface ResultResponseProtected {
  session_id: string;
  bmi: number;
  message: string;
}

export interface ResultResponseFull extends AssessmentResult {
  session_id: string;
}

// 边界值常量
export const VALIDATION = {
  age: { min: 1, max: 120 },
  height_cm: { min: 50, max: 260 },
  weight_kg: { min: 15, max: 500 },
  target_weight_kg: { min: 15, max: 500 },
  weight_change_threshold: 0.6, // 目标体重与当前体重差距超过 60% 视为不合理
} as const;