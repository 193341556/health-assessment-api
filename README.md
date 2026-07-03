---
title: Health Assessment API
emoji: 🏃
colorFrom: purple
colorTo: blue
sdk: docker
app_file: Dockerfile
pinned: false
---

# Health Assessment API

[![CI](https://github.com/193341556/health-assessment-api/actions/workflows/ci.yml/badge.svg)](https://github.com/193341556/health-assessment-api/actions/workflows/ci.yml)

健康测评后端 API 服务

## 在线演示

**前端**: https://wzc183265-health-assessment-api.hf.space

**API Base**: `https://wzc183265-health-assessment-api.hf.space/api/v1`

## 技术栈

- Node.js + TypeScript
- Express.js
- Jest + ts-jest

## 快速启动

```bash
npm install
npm run build
node dist/index.js
# 服务运行在 http://localhost:7860
```

## 测试

```bash
npm test
```

## API 接口

所有接口前缀 `/api/v1`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/assessment` | 创建新测评会话 |
| GET | `/api/v1/assessment/:session_id` | 获取测评进度 |
| PATCH | `/api/v1/assessment/:session_id` | 分步保存数据 |
| POST | `/api/v1/assessment/:session_id/submit` | 触发健康评估计算 |
| GET | `/api/v1/result/:session_id` | 获取结果（差异化返回）|
| POST | `/api/v1/pay/:session_id` | 模拟支付 |

## cURL 示例

```bash
# 创建会话
curl -X POST https://wzc183265-health-assessment-api.hf.space/api/v1/assessment

# 分步保存（完整数据）
curl -X PATCH https://wzc183265-health-assessment-api.hf.space/api/v1/assessment/{session_id} \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","age":25,"height_cm":175,"weight_kg":70,"target_weight_kg":65,"activity_level":"moderate","goal":"减重","current_step":5}'

# 提交计算
curl -X POST https://wzc183265-health-assessment-api.hf.space/api/v1/assessment/{session_id}/submit

# 模拟支付
curl -X POST https://wzc183265-health-assessment-api.hf.space/api/v1/pay/{session_id}
```

## 差异化返回说明

**非会员**：仅返回 BMI
```json
{
  "session_id": "xxx",
  "bmi": 22.86,
  "message": "开通会员解锁完整报告"
}
```

**已支付会员**：返回完整数据
```json
{
  "session_id": "xxx",
  "bmi": 22.86,
  "recommended_intake_kcal": 2594,
  "target_date": "2026-08-20",
  "computed_at": "2026-07-02T11:13:28.483Z"
}
```

## 已支付测试 Session

```
session_id: 8f9432da9a3547c1a6403f991de772ab
```

可用于对比付费前后的差异化返回：
```bash
# 未付费结果
curl https://wzc183265-health-assessment-api.hf.space/api/v1/result/{未付费session_id}

# 已付费结果
curl https://wzc183265-health-assessment-api.hf.space/api/v1/result/639025bdd74043f8be4d2e65e1e0888c
```

## 数据库 Schema

详见 [SCHEMA.md](SCHEMA.md)

## AI 使用复盘

详见 [AI_RECAP.md](AI_RECAP.md)

## 测试覆盖范围

| 测试类型 | 覆盖内容 |
|---------|---------|
| 算法单元测试 | BMI、BMR、TDEE 计算；极端值（身高100cm/250cm、体重30kg/300kg、年龄边界）；非法值校验 |
| 分步保存集成测试 | 中断后恢复、乱序提交、重复提交、字段覆盖 |
| 差异化返回测试 | 非会员仅得BMI；已支付得完整数据；支付后状态变更 |
| 数据验证测试 | 必填字段缺失、值域越界、类型错误、session 不存在 |
| API 状态码测试 | 200/400/404/500 各场景正确返回 |

**未覆盖场景**：
- 并发更新同一 session（内存存储无锁，低优先级）
- 24h TTL 过期后数据清理（需定时任务，当前由内存泄漏被动触发）
- 实际第三方支付回调集成（本次为模拟接口）
