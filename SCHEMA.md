# 数据库 Schema

## ER 图

```
┌─────────────────────┐     ┌─────────────────────┐
│  assessment_sessions│     │  assessment_records  │
├─────────────────────┤     ├─────────────────────┤
│ session_id (PK)     │────<│ session_id (FK)     │
│ created_at          │     │ gender               │
│ expires_at          │     │ age                  │
└─────────────────────┘     │ height_cm            │
                             │ weight_kg            │
                             │ target_weight_kg     │
                             │ activity_level       │
                             │ goal                 │
                             │ current_step         │
                             │ status               │
                             │ updated_at           │
                             └──────────┬──────────┘
                                        │
                    ┌────────────────────┴────────────────────┐
                    │                                     │
                    ▼                                     ▼
      ┌─────────────────────┐               ┌─────────────────────┐
      │  assessment_results │               │   subscriptions     │
      ├─────────────────────┤               ├─────────────────────┤
      │ session_id (FK, PK) │               │ session_id (FK, PK) │
      │ bmi                 │               │ status              │
      │ bmr                 │               │ created_at          │
      │ tdee                │               │ expires_at          │
      │ recommended_kcal    │               └─────────────────────┘
      │ target_date         │
      │ created_at          │
      └─────────────────────┘
```

## 表结构说明

### assessment_sessions
| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | VARCHAR(64) PK | 会话唯一标识 |
| created_at | TIMESTAMP | 创建时间 |
| expires_at | TIMESTAMP | 过期时间（24h TTL） |

### assessment_records
| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | VARCHAR(64) FK | 关联 sessions |
| gender | VARCHAR(10) | 性别 male/female |
| age | INT | 年龄 10-100 |
| height_cm | DECIMAL | 身高 cm |
| weight_kg | DECIMAL | 当前体重 kg |
| target_weight_kg | DECIMAL | 目标体重 kg |
| activity_level | VARCHAR(20) | 活动水平 |
| goal | VARCHAR(20) | 健康目标 |
| current_step | INT | 当前步骤 1-5 |
| status | VARCHAR(20) | in_progress/completed |
| updated_at | TIMESTAMP | 最后更新时间 |

### assessment_results
| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | VARCHAR(64) FK/PK | 关联 sessions |
| bmi | DECIMAL | 体质指数 |
| bmr | INT | 基础代谢率 kcal |
| tdee | INT | 总每日能量消耗 |
| recommended_kcal | INT | 每日推荐摄入 |
| target_date | DATE | 预计目标日期 |
| created_at | TIMESTAMP | 计算时间 |

### subscriptions
| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | VARCHAR(64) FK/PK | 关联 sessions |
| status | VARCHAR(20) | none/active/expired |
| created_at | TIMESTAMP | 开通时间 |
| expires_at | TIMESTAMP | 到期时间 |

## 关联关系

- `sessions` 1:1 `records` — 每条会话对应一条记录
- `sessions` 1:1 `results` — 每条会话计算一次结果
- `sessions` 1:1 `subscriptions` — 每条会话独立订阅状态
- 结果差异化逻辑：`subscriptions.status = 'active'` 时 result 接口返回完整数据，否则仅返回 BMI
