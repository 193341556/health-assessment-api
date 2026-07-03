// 核心类型定义

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type AssessmentStatus = 'draft' | 'completed';
export type SubscriptionStatus = 'none' | 'active' | 'expired';

export interface MacroNutrients {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// 会话表
export interface AssessmentSession {
  session_id: string;
  created_at: Date;
  expires_at: Date;
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
  bmi_category: string | null;
  bmr: number | null;
  tdee: number | null;
  recommended_kcal: number | null;
  target_date: Date | null;
  weekly_targets: number[] | null;
  health_risks: string[] | null;
  exercise_advice: string | null;
  macros: MacroNutrients | null;
  computed_at: Date;
}

// 订阅表
export interface Subscription {
  session_id: string;
  status: SubscriptionStatus;
  created_at: Date;
  expires_at: Date | null;
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

export interface GetAssessmentResponse extends AssessmentRecord {}

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
  age: { min: 10, max: 100 },
  height_cm: { min: 100, max: 250 },
  weight_kg: { min: 30, max: 300 },
  target_weight_kg: { min: 30, max: 300 },
  weight_change_threshold: 0.6,
} as const;
