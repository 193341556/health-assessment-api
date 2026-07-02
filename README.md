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

健康测评后端 API 服务

## 在线演示

**API Base**: https://wzc183265-health-assessment-api.hf.space/api/v1

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/assessment` | 创建新测评会话 |
| GET | `/api/v1/assessment/:session_id` | 获取测评进度 |
| PATCH | `/api/v1/assessment/:session_id` | 分步保存数据 |
| POST | `/api/v1/assessment/:session_id/submit` | 触发健康评估计算 |
| GET | `/api/v1/result/:session_id` | 获取结果（差异化返回）|
| POST | `/api/v1/pay/:session_id` | 模拟支付 |