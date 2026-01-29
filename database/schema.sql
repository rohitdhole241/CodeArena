-- MongoDB is a NoSQL database, but here's a SQL representation
-- of the schema for reference and potential migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    
    -- Profile statistics
    problems_solved INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    accepted_submissions INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_submission_date TIMESTAMP,
    
    -- Preferences
    preferred_language VARCHAR(20) DEFAULT 'javascript',
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    
    -- Status and timestamps
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(50) NOT NULL,
    
    -- JSON fields for complex data
    examples JSON NOT NULL,
    constraints JSON NOT NULL,
    test_cases JSON NOT NULL,
    hints JSON DEFAULT '[]',
    starter_code JSON DEFAULT '{}',
    
    -- Performance limits
    time_limit INTEGER DEFAULT 2000, -- milliseconds
    memory_limit INTEGER DEFAULT 256, -- MB
    
    -- Statistics
    total_submissions INTEGER DEFAULT 0,
    accepted_submissions INTEGER DEFAULT 0,
    solved_by INTEGER DEFAULT 0,
    
    -- Metadata
    tags JSON DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust')),
    
    -- Judgment results
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    test_results JSON DEFAULT '[]',
    runtime VARCHAR(20),
    memory VARCHAR(20),
    execution_time INTEGER, -- milliseconds
    memory_used NUMERIC(10,2), -- MB
    passed_tests INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    error_details TEXT,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    judged_at TIMESTAMP
);

-- User solved problems (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_solved_problems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    best_runtime VARCHAR(20),
    best_memory VARCHAR(20),
    UNIQUE(user_id, problem_id)
);

-- Problem hints
CREATE TABLE IF NOT EXISTS hints (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    content TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    category VARCHAR(20) DEFAULT 'approach' CHECK (category IN ('approach', 'algorithm', 'data-structure', 'optimization', 'edge-case')),
    unlock_cost INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notes
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true,
    tags JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, problem_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_active ON problems(is_active);
CREATE INDEX IF NOT EXISTS idx_problems_title ON problems(title);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_language ON submissions(language);

CREATE INDEX IF NOT EXISTS idx_solved_problems_user_id ON user_solved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_solved_problems_problem_id ON user_solved_problems(problem_id);

CREATE INDEX IF NOT EXISTS idx_hints_problem_id ON hints(problem_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_problem_id ON notes(problem_id);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
