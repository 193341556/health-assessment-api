-- 001_init.sql
-- 健康测评系统数据库表结构

-- 会话表
CREATE TABLE IF NOT EXISTS assessment_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP(3) NOT NULL
);

-- 测评记录表
CREATE TABLE IF NOT EXISTS assessment_records (
    session_id VARCHAR(64) PRIMARY KEY,
    gender VARCHAR(10),
    age INT,
    height_cm DECIMAL(8,2),
    weight_kg DECIMAL(8,2),
    target_weight_kg DECIMAL(8,2),
    activity_level VARCHAR(20),
    goal VARCHAR(20),
    current_step INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_records_session FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- 测评结果表
CREATE TABLE IF NOT EXISTS assessment_results (
    session_id VARCHAR(64) PRIMARY KEY,
    bmi DECIMAL(8,2) NOT NULL,
    bmi_category VARCHAR(20),
    bmr INT,
    tdee INT,
    recommended_kcal INT,
    target_date TIMESTAMP(3),
    weekly_targets JSONB,
    health_risks JSONB,
    exercise_advice TEXT,
    macros JSONB,
    computed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_session FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    session_id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'none',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP(3),
    CONSTRAINT fk_subscriptions_session FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_status ON assessment_records(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON assessment_sessions(expires_at);
