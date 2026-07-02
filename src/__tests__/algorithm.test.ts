// 算法单元测试

import {
  calculateBMI,
  calculateRecommendedIntake,
  calculateTargetDate,
  validateInput,
  computeAssessment,
} from '../algorithm';

describe('calculateBMI', () => {
  test('正常体重计算', () => {
    expect(calculateBMI(170, 65)).toBeCloseTo(22.49, 1);
  });

  test('身高170cm，体重80kg', () => {
    expect(calculateBMI(170, 80)).toBeCloseTo(27.68, 1);
  });

  test('极端值：身高50cm，体重15kg', () => {
    expect(calculateBMI(50, 15)).toBeCloseTo(60, 0);
  });

  test('极端值：身高260cm，体重500kg', () => {
    expect(calculateBMI(260, 500)).toBeCloseTo(73.98, 1);
  });
});

describe('calculateRecommendedIntake', () => {
  test('男性，轻度活动', () => {
    const result = calculateRecommendedIntake('male', 30, 170, 65, 'light');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(4000);
  });

  test('女性，中度活动', () => {
    const result = calculateRecommendedIntake('female', 25, 160, 55, 'moderate');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(4000);
  });

  test('男性，久坐', () => {
    const result = calculateRecommendedIntake('male', 40, 180, 90, 'sedentary');
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateTargetDate', () => {
  test('减重5kg', () => {
    const today = new Date();
    const target = calculateTargetDate(80, 75);
    const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // 5kg / 0.75kg每周 ≈ 7周 = 49天
    expect(daysDiff).toBeGreaterThanOrEqual(48);
    expect(daysDiff).toBeLessThanOrEqual(56);
  });

  test('体重不变', () => {
    const today = new Date();
    const target = calculateTargetDate(70, 70);
    const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeLessThanOrEqual(7);
  });
});

describe('validateInput', () => {
  test('有效输入', () => {
    const result = validateInput({
      age: 30,
      height_cm: 170,
      weight_kg: 65,
      target_weight_kg: 60,
    });
    expect(result.valid).toBe(true);
  });

  test('年龄超出范围', () => {
    const result = validateInput({ age: 200 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('年龄');
  });

  test('身高超出范围', () => {
    const result = validateInput({ height_cm: 30 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('身高');
  });

  test('体重超出范围', () => {
    const result = validateInput({ weight_kg: 600 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('体重');
  });

  test('目标体重差距过大', () => {
    const result = validateInput({
      weight_kg: 50,
      target_weight_kg: 19, // 差距超过60%
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('差距过大');
  });

  test('空输入应该通过基本校验', () => {
    const result = validateInput({});
    expect(result.valid).toBe(true);
  });
});

describe('computeAssessment', () => {
  test('完整计算', () => {
    const result = computeAssessment({
      gender: 'male',
      age: 30,
      height_cm: 170,
      weight_kg: 70,
      target_weight_kg: 65,
      activity_level: 'moderate',
    });

    expect(result.bmi).toBeGreaterThan(0);
    expect(result.recommended_intake_kcal).toBeGreaterThan(0);
    expect(result.target_date).toBeInstanceOf(Date);
  });
});