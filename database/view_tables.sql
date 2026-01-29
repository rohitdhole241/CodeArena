-- View all registrations
SELECT * FROM registrations;

-- View all users
SELECT * FROM users;

-- View recent submissions
SELECT 
    u.username,
    p.title as problem,
    s.status,
    s.language,
    s.runtime,
    datetime(s.created_at) as submitted_at
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN problems p ON s.problem_id = p.id
ORDER BY s.created_at DESC
LIMIT 10;

-- View registration stats
SELECT 
    status,
    COUNT(*) as count,
    datetime(MAX(created_at)) as last_registration
FROM registrations
GROUP BY status;
