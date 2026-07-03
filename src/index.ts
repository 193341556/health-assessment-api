// 服务入口

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import routes from './routes';

const app = express();
app.set('trust proxy', 1);

const PORT = parseInt(process.env.PORT || '7860');
const HOST = '0.0.0.0';
const START_TIME = Date.now();

// 安全头（禁用 CSP，因为前端使用内联脚本）
app.use(helmet({
  contentSecurityPolicy: false,
}));

// 限流：每个 IP 每分钟 100 次请求
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
}));

// CORS 严格化：仅允许指定来源
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// 响应压缩
app.use(compression());

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// body 解析
app.use(express.json({ limit: '1mb' }));

// 全局 BigInt → Number 转换（防止 Node.js 24 序列化报错）
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    const replacer = (_key: string, value: unknown) =>
      typeof value === 'bigint' ? Number(value) : value;
    return originalJson(JSON.parse(JSON.stringify(body, replacer)));
  };
  next();
});

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// API 版本化路由
app.use('/api/v1', routes);

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({ error: '服务端内部错误' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 健康检查（增强版）
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - START_TIME) / 1000) + 's',
    timestamp: new Date().toISOString(),
  });
});

// HF Spaces 健康检查根路径
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'health-assessment-api' });
});

// 启动
app.listen(PORT, HOST, () => {
  console.log(`健康测评后端服务运行在 http://localhost:${PORT}`);
});

export default app;
