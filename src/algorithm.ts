// 健康评估算法 - 纯函数模块，不依赖数据库/HTTP

import { VALIDATION, Gender, ActivityLevel } from './types';

/**
 * 计算 BMI
 * BMI = 体重(kg) / 身高(m)^2
 */
export function calculateBMI(height_cm: number, weight_kg: number): number {
  const height_m = height_cm / 100;
  return weight_kg / (height_m * height_m);
}

/**
 * 判断 BMI 等级
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '偏低';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏高';
  return '过高';
}

/**
 * 根据性别、年龄、身高、体重、活动水平计算每日推荐摄入热量(kcal)
 * 使用 Mifflin-St Jeor 方程
 */
export function calculateRecommendedIntake(
  gender: Gender,
  age: number,
  height_cm: number,
  weight_kg: number,
  activity_level: ActivityLevel
): number {
  // 基础代谢率 (BMR)
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 活动水平乘数
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const multiplier = activityMultipliers[activity_level];
  return Math.round(bmr * multiplier);
}

/**
 * 计算目标日期
 * 假设每周健康减重 0.5-1kg
 */
export function calculateTargetDate(
  currentWeight: number,
  targetWeight: number
): Date {
  const weightDiff = Math.abs(currentWeight - targetWeight);
  // 每周减重 0.75kg 作为平均值
  const weeksToGoal = Math.ceil(weightDiff / 0.75);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);
  return targetDate;
}

/**
 * 校验输入数据是否合法
 */
export function validateInput(data: {
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  target_weight_kg?: number | null;
}): { valid: boolean; error?: string } {
  const { age, height_cm, weight_kg, target_weight_kg } = data;

  if (age !== undefined && age !== null) {
    if (age < VALIDATION.age.min || age > VALIDATION.age.max) {
      return { valid: false, error: `年龄必须在 ${VALIDATION.age.min}-${VALIDATION.age.max} 之间` };
    }
  }

  if (height_cm !== undefined && height_cm !== null) {
    if (height_cm < VALIDATION.height_cm.min || height_cm > VALIDATION.height_cm.max) {
      return { valid: false, error: `身高必须在 ${VALIDATION.height_cm.min}-${VALIDATION.height_cm.max} cm 之间` };
    }
  }

  if (weight_kg !== undefined && weight_kg !== null) {
    if (weight_kg < VALIDATION.weight_kg.min || weight_kg > VALIDATION.weight_kg.max) {
      return { valid: false, error: `体重必须在 ${VALIDATION.weight_kg.min}-${VALIDATION.weight_kg.max} kg 之间` };
    }
  }

  if (target_weight_kg !== undefined && target_weight_kg !== null) {
    if (target_weight_kg < VALIDATION.target_weight_kg.min || target_weight_kg > VALIDATION.target_weight_kg.max) {
      return { valid: false, error: `目标体重必须在 ${VALIDATION.target_weight_kg.min}-${VALIDATION.target_weight_kg.max} kg 之间` };
    }
  }

  // 检查目标体重与当前体重的差距
  if (weight_kg !== undefined && weight_kg !== null && target_weight_kg !== undefined && target_weight_kg !== null) {
    const changeRatio = Math.abs(target_weight_kg - weight_kg) / weight_kg;
    if (changeRatio > VALIDATION.weight_change_threshold) {
      return { valid: false, error: '目标体重与当前体重差距过大，请重新设定' };
    }
  }

  return { valid: true };
}

/**
 * 执行完整的健康评估计算
 */
export function computeAssessment(data: {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  activity_level: ActivityLevel;
}): {
  bmi: number;
  recommended_intake_kcal: number;
  target_date: Date;
} {
  const { gender, age, height_cm, weight_kg, target_weight_kg, activity_level } = data;

  const bmi = calculateBMI(height_cm, weight_kg);
  const recommended_intake_kcal = calculateRecommendedIntake(
    gender,
    age,
    height_cm,
    weight_kg,
    activity_level
  );
  const target_date = calculateTargetDate(weight_kg, target_weight_kg);

  return {
    bmi: Math.round(bmi * 100) / 100, // 保留两位小数
    recommended_intake_kcal,
    target_date,
  };
}