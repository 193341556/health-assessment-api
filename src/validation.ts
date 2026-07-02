// Zod 校验 Schema

import { z } from 'zod';

export const updateAssessmentSchema = z.object({
  gender: z.enum(['male', 'female']).nullable().optional(),
  goal: z.string().nullable().optional(),
  age: z.number().int().min(10).max(100).nullable().optional(),
  height_cm: z.number().int().min(100).max(250).nullable().optional(),
  weight_kg: z.number().min(30).max(300).nullable().optional(),
  target_weight_kg: z.number().min(30).max(300).nullable().optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active']).nullable().optional(),
  current_step: z.number().int().min(0).max(10).optional(),
  status: z.enum(['draft', 'completed']).optional(),
}).refine((data) => {
  // 目标体重与当前体重差距不超过 60%
  if (data.weight_kg !== undefined && data.weight_kg !== null &&
      data.target_weight_kg !== undefined && data.target_weight_kg !== null) {
    const diff = Math.abs(data.weight_kg - data.target_weight_kg);
    return diff / data.weight_kg <= 0.6;
  }
  return true;
}, {
  message: '目标体重与当前体重差距过大',
});

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
