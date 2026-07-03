// API 路由

import { Router, Request, Response } from 'express';
import {
  createAssessment,
  getRecord,
  updateRecord,
  getResult,
  getSubscription,
  activateSubscription,
  isRecordComplete,
  createResult,
} from './storage';
import { computeAssessment } from './algorithm';
import { updateAssessmentSchema } from './validation';

const router = Router();

// POST /assessment - 创建新测评会话
router.post('/assessment', (req: Request, res: Response) => {
  try {
    const session = createAssessment();
    res.status(201).json({
      session_id: session.session_id,
      current_step: 0,
    });
  } catch (error) {
    res.status(500).json({ error: '创建测评会话失败' });
  }
});

// GET /assessment/:session_id - 获取测评进度
router.get('/assessment/:session_id', (req: Request, res: Response) => {
  try {
    const session_id = req.params.session_id as string;
    const record = getRecord(session_id);

    if (!record) {
      res.status(404).json({ error: '测评记录不存在' });
      return;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '获取测评记录失败' });
  }
});

// PATCH /assessment/:session_id - 分步保存
router.patch('/assessment/:session_id', (req: Request, res: Response) => {
  try {
    const session_id = req.params.session_id as string;

    // Zod 校验
    const parsed = updateAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.issues[0].message });
      return;
    }

    const record = updateRecord(session_id, parsed.data);

    if (!record) {
      res.status(404).json({ error: '测评记录不存在' });
      return;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '更新测评记录失败' });
  }
});

// POST /assessment/:session_id/submit - 触发计算
router.post('/assessment/:session_id/submit', (req: Request, res: Response) => {
  try {
    const session_id = req.params.session_id as string;
    const record = getRecord(session_id);

    if (!record) {
      res.status(404).json({ error: '测评记录不存在' });
      return;
    }

    // 检查数据完整性
    if (!isRecordComplete(record)) {
      res.status(400).json({ error: '请先完成所有必填项' });
      return;
    }

    // 执行计算
    const computed = computeAssessment({
      gender: record.gender!,
      age: record.age!,
      height_cm: record.height_cm!,
      weight_kg: record.weight_kg!,
      target_weight_kg: record.target_weight_kg!,
      activity_level: record.activity_level!,
    });

    // 保存结果
    const result = createResult(session_id, computed);

    // 更新记录状态
    updateRecord(session_id, { status: 'completed' });

    res.json({
      session_id,
      status: 'completed',
      computed_at: result.computed_at,
    });
  } catch (error) {
    console.error('计算失败:', error);
    res.status(500).json({ error: '计算评估结果失败' });
  }
});

// GET /result/:session_id - 差异化结果返回
router.get('/result/:session_id', (req: Request, res: Response) => {
  try {
    const session_id = req.params.session_id as string;
    const record = getRecord(session_id);
    const result = getResult(session_id);
    const subscription = getSubscription(session_id);

    if (!record) {
      res.status(404).json({ error: '测评记录不存在' });
      return;
    }

    if (!result) {
      res.status(404).json({ error: '测评结果不存在，请先提交' });
      return;
    }

    // 检查订阅状态
    if (subscription?.status === 'active') {
      // 会员返回完整结果
      res.json({
        session_id,
        bmi: result.bmi,
        bmi_category: result.bmi_category,
        bmr: result.bmr,
        tdee: result.tdee,
        recommended_intake_kcal: result.recommended_kcal,
        target_date: result.target_date,
        weekly_targets: result.weekly_targets,
        health_risks: result.health_risks,
        exercise_advice: result.exercise_advice,
        macros: result.macros,
        computed_at: result.computed_at,
      });
    } else {
      // 非会员返回脱敏结果
      res.json({
        session_id,
        bmi: result.bmi,
        bmi_category: result.bmi_category,
        weekly_targets: null,
        bmr: null,
        tdee: null,
        recommended_intake_kcal: null,
        target_date: null,
        health_risks: null,
        exercise_advice: null,
        macros: null,
        message: '开通会员解锁完整报告（BMR/TDEE/热量/曲线/风险/建议）',
      });
    }
  } catch (error) {
    res.status(500).json({ error: '获取结果失败' });
  }
});

// POST /pay/:session_id - 模拟支付
router.post('/pay/:session_id', (req: Request, res: Response) => {
  try {
    const session_id = req.params.session_id as string;
    const subscription = getSubscription(session_id);

    if (!subscription) {
      res.status(404).json({ error: '订阅记录不存在' });
      return;
    }

    // 幂等：重复调用不报错
    const activated = activateSubscription(session_id);

    res.json({
      session_id,
      status: activated?.status,
      message: '支付成功',
    });
  } catch (error) {
    res.status(500).json({ error: '支付失败' });
  }
});

export default router;