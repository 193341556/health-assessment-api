// API 集成测试

import express from 'express';
import request from 'supertest';
import routes from '../routes';
import { clearAllData } from '../storage';

const app = express();
app.use(express.json());
app.use('/', routes);

beforeEach(() => {
  clearAllData();
});

describe('POST /assessment', () => {
  test('创建测评会话', async () => {
    const res = await request(app).post('/assessment').expect(201);

    expect(res.body.session_id).toBeDefined();
    expect(res.body.session_id.length).toBe(32);
    expect(res.body.current_step).toBe(0);
  });
});

describe('GET /assessment/:session_id', () => {
  test('获取不存在的记录返回404', async () => {
    await request(app).get('/assessment/nonexistent').expect(404);
  });

  test('获取新建会话的初始状态', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    const res = await request(app).get(`/assessment/${sessionId}`).expect(200);

    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.status).toBe('draft');
    expect(res.body.current_step).toBe(0);
    expect(res.body.gender).toBeNull();
  });
});

describe('PATCH /assessment/:session_id', () => {
  test('分步保存数据', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    const res = await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({ gender: 'male', age: 30, current_step: 1 })
      .expect(200);

    expect(res.body.gender).toBe('male');
    expect(res.body.age).toBe(30);
    expect(res.body.current_step).toBe(1);
  });

  test('current_step 只前进不倒退', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({ current_step: 3 })
      .expect(200);

    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({ current_step: 1 })
      .expect(200)
      .then((res) => {
        expect(res.body.current_step).toBe(3);
      });
  });

  test('非法数据返回422', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({ age: 200 })
      .expect(422);
  });
});

describe('POST /assessment/:session_id/submit', () => {
  test('数据不完整返回400', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    await request(app)
      .post(`/assessment/${sessionId}/submit`)
      .expect(400);
  });

  test('完整数据提交成功', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    // 填写完整数据
    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({
        gender: 'male',
        age: 30,
        height_cm: 170,
        weight_kg: 70,
        target_weight_kg: 65,
        activity_level: 'moderate',
        goal: '减重',
        current_step: 5,
      })
      .expect(200);

    const res = await request(app)
      .post(`/assessment/${sessionId}/submit`)
      .expect(200);

    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.status).toBe('completed');
    expect(res.body.computed_at).toBeDefined();
  });
});

describe('GET /result/:session_id', () => {
  test('未提交结果返回404', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    await request(app).get(`/result/${sessionId}`).expect(404);
  });

  test('非会员获取脱敏结果', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    // 填写并提交
    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({
        gender: 'male',
        age: 30,
        height_cm: 170,
        weight_kg: 70,
        target_weight_kg: 65,
        activity_level: 'moderate',
        goal: '减重',
        current_step: 5,
      })
      .expect(200);

    await request(app).post(`/assessment/${sessionId}/submit`).expect(200);

    const res = await request(app).get(`/result/${sessionId}`).expect(200);

    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.bmi).toBeDefined();
    expect(res.body.message).toBeDefined();
    expect(res.body.recommended_intake_kcal).toBe(null);
  });
});

describe('POST /pay/:session_id', () => {
  test('模拟支付成功', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    const res = await request(app).post(`/pay/${sessionId}`).expect(200);

    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.status).toBe('active');
    expect(res.body.message).toBe('支付成功');
  });

  test('重复支付幂等', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    await request(app).post(`/pay/${sessionId}`).expect(200);
    await request(app).post(`/pay/${sessionId}`).expect(200);
  });
});

describe('支付后获取完整结果', () => {
  test('会员获取完整结果', async () => {
    const createRes = await request(app).post('/assessment').expect(201);
    const sessionId = createRes.body.session_id;

    // 填写并提交
    await request(app)
      .patch(`/assessment/${sessionId}`)
      .send({
        gender: 'male',
        age: 30,
        height_cm: 170,
        weight_kg: 70,
        target_weight_kg: 65,
        activity_level: 'moderate',
        goal: '减重',
        current_step: 5,
      })
      .expect(200);

    await request(app).post(`/assessment/${sessionId}/submit`).expect(200);

    // 支付
    await request(app).post(`/pay/${sessionId}`).expect(200);

    // 获取完整结果
    const res = await request(app).get(`/result/${sessionId}`).expect(200);

    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.bmi).toBeDefined();
    expect(res.body.recommended_intake_kcal).toBeDefined();
    expect(res.body.target_date).toBeDefined();
    expect(res.body.computed_at).toBeDefined();
  });
});