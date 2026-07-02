# 健康测评系统

睿迄科技全栈开发3天挑战项目。

## 在线演示

**前端**: https://health-assessment-xxx.zeabur.app （替换为你的部署URL）

**API Base**: `https://health-assessment-xxx.zeabur.app/api/v1`

## 技术栈

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **测试**: Jest + ts-jest + supertest
- **校验**: Zod Schema
- **安全**: Helmet + express-rate-limit + CORS
- **部署**: Zeabur

## 快速开始

### 本地开发

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
npm start
```

### 运行测试

```bash
npm test
```

### 一键测试并查看覆盖率

```bash
npm run test:coverage
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

## 数据库设计

四张表，全部以 `session_id` 为锚点：

- `assessment_sessions` - 会话表
- `assessment_records` - 测评记录表
- `assessment_results` - 测评结果表
- `subscriptions` - 订阅状态表

## Schema 图

```
┌─────────────────┐
│ assessment_     │
│ sessions        │
├─────────────────┤
│ session_id (PK) │
│ created_at      │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│ assessment_     │
│ records         │
├─────────────────┤
│ session_id (PK) │
│ gender          │
│ age             │
│ height_cm       │
│ weight_kg       │
│ target_weight   │
│ activity_level  │
│ goal            │
│ current_step    │
│ status          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ assessment_     │     │ subscriptions   │
│ results         │     ├─────────────────┤
├─────────────────┤     │ session_id (PK) │
│ session_id (PK) │◄────│ status          │
│ bmi             │     │ paid_at         │
│ recommended_    │     └─────────────────┘
│   intake_kcal   │
│ target_date     │
└─────────────────┘
```

## 测试覆盖

| 类别 | 覆盖内容 |
|------|----------|
| 算法单元测试 | BMI计算、推荐摄入量、目标日期、输入校验 |
| 边界值测试 | 年龄10-100、身高100-250cm、体重30-300kg、目标差距≤60% |
| API 集成测试 | 分步保存、进度恢复、差异化返回、支付幂等性 |
| 安全测试 | Zod 校验拒绝非法值、rate limiting |

**29个测试全部通过**

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `ALLOWED_ORIGIN` | CORS 允许的来源 | `*` |

## 部署 Zeabur

1. Fork 本仓库到你的 GitHub
2. 去 [zeabur.com](https://zeabur.com) 注册并连接 GitHub
3. 点击 **Deploy from GitHub** → 选择本仓库
4. 自动构建部署，获得公网 URL

## CI/CD

GitHub Actions 自动运行：
- TypeScript 类型检查
- 29个单元/集成测试
- 生产构建验证

## cURL 测试示例

```bash
# 创建会话
curl -X POST https://your-url.zeabur.app/api/v1/assessment

# 填写数据（替换 {session_id}）
curl -X PATCH https://your-url.zeabur.app/api/v1/assessment/{session_id} \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","age":30,"height_cm":170,"weight_kg":70,"target_weight_kg":65,"activity_level":"moderate","goal":"减重","current_step":5}'

# 提交计算
curl -X POST https://your-url.zeabur.app/api/v1/assessment/{session_id}/submit

# 获取脱敏结果（未支付）
curl https://your-url.zeabur.app/api/v1/result/{session_id}

# 模拟支付
curl -X POST https://your-url.zeabur.app/api/v1/pay/{session_id}

# 获取完整结果（支付后）
curl https://your-url.zeabur.app/api/v1/result/{session_id}
```

## 已支付测试 session_id

创建会话后调用 `/pay/{session_id}` 即可测试会员流程。
