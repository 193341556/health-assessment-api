# AI 使用复盘

## 如何利用 AI 协助开发

### 1. 数据库建模

在设计 4 张表结构时，AI 根据需求分析了 BetterMe Quiz Funnel 的数据流，建议了 `assessment_sessions` 作为核心会话表、`assessment_records` 存储分步数据、`assessment_results` 存储计算结果、`subscriptions` 存储订阅状态的分层结构。

关键决策点：AI 一开始建议用 `user_id` 关联，但我否决了——挑战要求"无需登录即可参与"，改为 `session_id` 作为匿名会话标识更合理。

### 2. Mock 数据与边界场景

AI 生成了覆盖极端值的测试数据，包括：身高 100cm / 250cm、体重 30kg / 300kg、目标体重超出当前 60% 等边界条件。这些在无 AI 情况下容易被忽略，但 AI 能快速列举并生成对应的测试用例。

### 3. 核心算法实现

健康评估算法（BMI、BMR、TDEE、目标日期计算）由 AI 参考医学公式实现。我验证了关键逻辑：
- BMI = weight / (height/100)² — 正确
- BMR 用的是 Mifflin-St Jeor 公式 — 适合场景
- TDEE = BMR × 活动系数 — 行业标准

AI 还主动加了"目标体重与当前体重差距不超过60%"的前端校验，这个细节不在需求里，但 AI 认为是合理的用户体验保障，我保留了。

### 4. 测试用例生成

AI 一次性生成了 29 个测试用例，覆盖：
- 算法边界（极端身高/体重/年龄）
- 分步保存与进度恢复（中断后重新进入）
- 乱序提交与重复提交
- 差异化返回（非会员 vs 会员）
- /pay 回调状态变更端到端验证

### 5. 一次否决：订阅状态字段类型

AI 一开始把 `subscription.status` 设计为布尔值 `is_subscribed: boolean`。我否决了它，因为布尔值无法表达"已过期"这种中间状态——用户可能曾经付费但已过期。改为 `none | active | expired` 枚举更准确，后续如果加"退款"状态也容易扩展。

### 6. 一次否决：Helmet CSP 配置

AI 给前端用了内联 `<script>` 和 `onclick` 写法，同时后端开启了完整的 Helmet CSP。我在部署到 HF Spaces 后才发现两者冲突（CSP 拦截内联脚本导致按钮完全失效）。最后选择禁用 CSP（`contentSecurityPolicy: false`），因为 HF Spaces 本身已有安全层。

**为什么否决**：CSP 和内联脚本的组合是一个"看起来对但实际跑不通"的典型场景，AI 没有主动提示这个风险，我是在实际部署后发现问题才回头修的。

### 7. 部署问题排查

HF Spaces 部署时遇到两个问题：
1. **超时**：服务绑定 `localhost:3000`，HF Spaces 要求 `0.0.0.0:7860` — AI 没有主动检查环境要求，发现后立即修复
2. **rate-limit 警告**：`X-Forwarded-For` 头导致的 ValidationError — AI 建议加 `trust proxy`，已修复

## 总结

AI 在**结构化输出**（Schema、测试用例、API 文档）和**公式复现**（健康算法）上效率很高。但**部署环境细节**（HF Spaces 的端口要求、CSP 与内联脚本冲突）需要人工实际部署才能发现。最佳实践是：让 AI 负责代码生成，自己负责端到端验证。
