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
  if (bmi < 18.5) return '体重过轻';
  if (bmi < 24) return '体重正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

/**
 * 计算基础代谢率 (BMR)
 * 使用 Mifflin-St Jeor 方程
 */
export function calculateBMR(
  gender: Gender,
  age: number,
  height_cm: number,
  weight_kg: number
): number {
  if (gender === 'male') {
    return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age + 5);
  } else {
    return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age - 161);
  }
}

/**
 * 计算每日总消耗 (TDEE)
 */
export function calculateTDEE(
  gender: Gender,
  age: number,
  height_cm: number,
  weight_kg: number,
  activity_level: ActivityLevel
): number {
  const bmr = calculateBMR(gender, age, height_cm, weight_kg);
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  return Math.round(bmr * activityMultipliers[activity_level]);
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
  return calculateTDEE(gender, age, height_cm, weight_kg, activity_level);
}

/**
 * 获取健康风险提示
 */
export function getHealthRisks(bmi: number): string[] {
  const risks: string[] = [];
  if (bmi < 18.5) {
    risks.push('体重过低可能影响免疫力');
    risks.push('建议增加营养摄入');
  } else if (bmi >= 24 && bmi < 28) {
    risks.push('超重增加心血管疾病风险');
    risks.push('建议适当增加运动量');
  } else if (bmi >= 28) {
    risks.push('肥胖显著增加代谢综合征风险');
    risks.push('建议咨询医生制定减重计划');
  }
  return risks;
}

/**
 * 获取运动建议
 */
export function getExerciseAdvice(activity_level: ActivityLevel): string {
  const advice: Record<ActivityLevel, string> = {
    sedentary: '建议从每天散步30分钟开始，逐步增加运动量',
    light: '建议每周增加2-3次力量训练',
    moderate: '建议保持当前运动习惯，可尝试高强度间歇训练',
    active: '建议继续保持，可适当增加力量训练比例',
  };
  return advice[activity_level];
}

/**
 * 计算三大营养素分配（克）
 * 蛋白质 30%、碳水 40%、脂肪 30%
 */
export function calculateMacros(recommended_kcal: number): {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
} {
  return {
    protein_g: Math.round((recommended_kcal * 0.30) / 4),
    carbs_g: Math.round((recommended_kcal * 0.40) / 4),
    fat_g: Math.round((recommended_kcal * 0.30) / 9),
  };
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
  const weeksToGoal = Math.ceil(weightDiff / 0.75);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);
  return targetDate;
}

/**
 * 计算每周目标体重曲线
 * 返回从当前到目标每周的体重数组
 */
export function calculateWeeklyTargets(
  currentWeight: number,
  targetWeight: number
): number[] {
  const weightDiff = Math.abs(currentWeight - targetWeight);
  const weeklyLoss = 0.75; // 每周减重 0.75kg
  const weeks = Math.ceil(weightDiff / weeklyLoss);

  const targets: number[] = [];
  for (let week = 1; week <= weeks; week++) {
    const lost = week * weeklyLoss;
    const isGain = targetWeight > currentWeight;
    const weight = isGain
      ? currentWeight + lost
      : currentWeight - lost;
    // 确保不会超过目标
    const finalWeight = isGain
      ? Math.min(weight, targetWeight)
      : Math.max(weight, targetWeight);
    targets.push(Math.round(finalWeight * 10) / 10);
  }
  return targets;
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
  bmi_category: string;
  bmr: number;
  tdee: number;
  recommended_intake_kcal: number;
  target_date: Date;
  weekly_targets: number[];
  health_risks: string[];
  exercise_advice: string;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
} {
  const { gender, age, height_cm, weight_kg, target_weight_kg, activity_level } = data;

  const bmi = calculateBMI(height_cm, weight_kg);
  const bmi_category = getBMICategory(bmi);
  const bmr = calculateBMR(gender, age, height_cm, weight_kg);
  const tdee = calculateTDEE(gender, age, height_cm, weight_kg, activity_level);
  const recommended_intake_kcal = calculateRecommendedIntake(gender, age, height_cm, weight_kg, activity_level);
  const target_date = calculateTargetDate(weight_kg, target_weight_kg);
  const weekly_targets = calculateWeeklyTargets(weight_kg, target_weight_kg);
  const health_risks = getHealthRisks(bmi);
  const exercise_advice = getExerciseAdvice(activity_level);
  const macros = calculateMacros(recommended_intake_kcal);

  return {
    bmi: Math.round(bmi * 100) / 100,
    bmi_category,
    bmr,
    tdee,
    recommended_intake_kcal,
    target_date,
    weekly_targets,
    health_risks,
    exercise_advice,
    macros,
  };
}