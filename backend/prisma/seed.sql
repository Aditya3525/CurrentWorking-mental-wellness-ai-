-- Database Seeding Script for Enhanced Mental Wellbeing AI App
-- Purpose: Populate database with sample admin data and realistic content
-- Version: 2.0.0
-- Date: September 17, 2025

-- ============================================================================
-- SEED ADMIN USERS
-- ============================================================================

-- Create sample admin users
INSERT INTO users (
    id, email, name, password, firstName, lastName, isOnboarded, 
    isAdmin, role, permissions, isActive, createdAt, updatedAt
) VALUES 
(
    'admin_001',
    'admin@mentalwellbeing.app',
    'System Administrator',
    '$2b$10$rH.XHXRrWVpX5dCYxgZuOOxl5p9p9p9p9p9p9p9p9p9p9p9p9', -- hashed 'admin123'
    'System',
    'Administrator',
    true,
    true,
    'super_admin',
    '["content_create", "content_edit", "content_delete", "practice_create", "practice_edit", "practice_delete", "user_management", "analytics_view", "system_config"]',
    true,
    datetime('now'),
    datetime('now')
),
(
    'admin_002',
    'content.manager@mentalwellbeing.app',
    'Content Manager',
    '$2b$10$rH.XHXRrWVpX5dCYxgZuOOxl5p9p9p9p9p9p9p9p9p9p9p9p9', -- hashed 'content123'
    'Sarah',
    'Wilson',
    true,
    true,
    'content_manager',
    '["content_create", "content_edit", "practice_create", "practice_edit", "analytics_view"]',
    true,
    datetime('now'),
    datetime('now')
),
(
    'admin_003',
    'therapist@mentalwellbeing.app',
    'Dr. Michael Chen',
    '$2b$10$rH.XHXRrWVpX5dCYxgZuOOxl5p9p9p9p9p9p9p9p9p9p9p9p9', -- hashed 'therapy123'
    'Michael',
    'Chen',
    true,
    true,
    'admin',
    '["content_create", "content_edit", "practice_create", "practice_edit"]',
    true,
    datetime('now'),
    datetime('now')
);

-- ============================================================================
-- SEED ENHANCED CONTENT
-- ============================================================================

-- Comprehensive mental health content with enhanced fields
INSERT INTO content (
    id, title, type, category, subcategory, approach, content, contentUrl, 
    fileType, description, author, duration_int, difficulty, severity_level, 
    tags_array, status, is_published, featured, created_by, view_count, rating, rating_count
) VALUES

-- Mindfulness Content
(
    'content_001',
    'Introduction to Mindfulness Meditation',
    'video',
    'Mindfulness',
    'Basics',
    'Hybrid',
    'A comprehensive introduction to mindfulness meditation covering the fundamentals of present-moment awareness.',
    'https://youtube.com/watch?v=mindfulness101',
    'youtube',
    'Perfect for beginners, this video explains the core principles of mindfulness and guides you through your first meditation session.',
    'Dr. Sarah Chen',
    15,
    'Beginner',
    'Mild',
    '["mindfulness", "meditation", "beginner", "awareness", "present moment"]',
    'Published',
    true,
    true,
    'admin_002',
    1247,
    4.7,
    89
),

(
    'content_002',
    'Advanced Mindful Breathing Techniques',
    'audio',
    'Mindfulness',
    'Advanced Techniques',
    'Eastern',
    'Explore sophisticated breathing techniques used in traditional meditation practices.',
    'https://cdn.mentalwellbeing.app/audio/advanced-breathing.mp3',
    'mp3',
    'A 25-minute guided audio session featuring pranayama and other advanced breathing methods.',
    'Master Li Wei',
    25,
    'Advanced',
    'Moderate',
    '["breathing", "pranayama", "advanced", "meditation", "eastern"]',
    'Published',
    true,
    false,
    'admin_003',
    567,
    4.9,
    34
),

-- Anxiety Management Content
(
    'content_003',
    'Understanding Anxiety: A Science-Based Approach',
    'article',
    'Anxiety',
    'Education',
    'Western',
    'Comprehensive article explaining the neuroscience of anxiety and evidence-based treatment approaches.',
    NULL,
    'article',
    'Learn about the biological basis of anxiety and how modern psychology approaches its treatment.',
    'Dr. Emily Rodriguez',
    12,
    'Intermediate',
    'Moderate',
    '["anxiety", "neuroscience", "CBT", "education", "psychology"]',
    'Published',
    true,
    true,
    'admin_003',
    2156,
    4.6,
    142
),

(
    'content_004',
    'Cognitive Behavioral Therapy Workbook',
    'interactive',
    'Anxiety',
    'CBT Techniques',
    'Western',
    'Interactive workbook with CBT exercises and thought records.',
    'https://app.mentalwellbeing.app/cbt-workbook',
    'interactive',
    'Self-guided CBT workbook with interactive exercises for anxiety management.',
    'Dr. James Thompson',
    45,
    'Intermediate',
    'Moderate',
    '["CBT", "workbook", "anxiety", "interactive", "exercises"]',
    'Published',
    true,
    false,
    'admin_002',
    834,
    4.8,
    67
),

-- Stress Management Content
(
    'content_005',
    'Progressive Muscle Relaxation',
    'audio',
    'Stress Management',
    'Relaxation Techniques',
    'Western',
    'Guided progressive muscle relaxation session for stress relief.',
    'https://cdn.mentalwellbeing.app/audio/pmr-session.mp3',
    'mp3',
    '20-minute guided session teaching you to systematically relax each muscle group.',
    'Dr. Rachel Green',
    20,
    'Beginner',
    'Mild',
    '["stress relief", "relaxation", "PMR", "muscle tension", "guided"]',
    'Published',
    true,
    true,
    'admin_002',
    1678,
    4.5,
    123
),

-- Sleep Content
(
    'content_006',
    'Sleep Hygiene Masterclass',
    'video',
    'Sleep',
    'Sleep Science',
    'Western',
    'Complete guide to improving sleep quality through evidence-based sleep hygiene practices.',
    'https://youtube.com/watch?v=sleep-hygiene-master',
    'youtube',
    'Learn the science of sleep and practical strategies for better rest.',
    'Dr. Mark Sleep',
    35,
    'Beginner',
    'Mild',
    '["sleep", "hygiene", "insomnia", "sleep quality", "science"]',
    'Published',
    true,
    true,
    'admin_003',
    3421,
    4.9,
    287
),

-- Emotional Intelligence Content
(
    'content_007',
    'Building Emotional Resilience',
    'article',
    'Emotional Intelligence',
    'Resilience Building',
    'Hybrid',
    'Strategies for developing emotional resilience combining Western psychology and Eastern wisdom.',
    NULL,
    'article',
    'Practical guide to building emotional resilience using evidence-based techniques.',
    'Dr. Maria Santos',
    18,
    'Intermediate',
    'Moderate',
    '["resilience", "emotional intelligence", "coping", "stress", "psychology"]',
    'Published',
    true,
    false,
    'admin_002',
    945,
    4.4,
    78
),

-- Draft Content (for testing admin functionality)
(
    'content_008',
    'Advanced Trauma-Informed Practices',
    'video',
    'Emotional Intelligence',
    'Trauma Recovery',
    'Hybrid',
    'Specialized content for trauma-informed care and recovery practices.',
    'https://youtube.com/watch?v=trauma-informed',
    'youtube',
    'Expert guidance on trauma-informed approaches to mental health.',
    'Dr. Elena Vasquez',
    40,
    'Advanced',
    'Severe',
    '["trauma", "recovery", "PTSD", "advanced", "therapy"]',
    'Draft',
    false,
    false,
    'admin_003',
    0,
    NULL,
    0
);

-- ============================================================================
-- SEED PRACTICE DATA
-- ============================================================================

-- Enhanced practice entries with comprehensive metadata
INSERT INTO practices (
    id, title, description, instructions, duration, preparation_time, wind_down_time,
    practice_type, difficulty, category, subcategory, approach, severity_level,
    tags, audio_guide_url, visual_aids_url, equipment, benefits, 
    status, is_published, featured, created_by, view_count, rating, rating_count
) VALUES

-- Meditation Practices
(
    'practice_001',
    'Mindful Breathing Meditation',
    'A foundational meditation practice focusing on breath awareness.',
    'Sit comfortably with your back straight. Close your eyes and focus on your natural breath. When your mind wanders, gently return attention to your breathing. Notice the sensation of air entering and leaving your nostrils.',
    10,
    2,
    3,
    'Meditation',
    'Beginner',
    'Stress Relief',
    'Breath Awareness',
    'All',
    'Mild',
    '["meditation", "breathing", "mindfulness", "beginner", "foundation"]',
    'https://cdn.mentalwellbeing.app/audio/mindful-breathing-10min.mp3',
    'https://cdn.mentalwellbeing.app/images/breathing-meditation-guide.jpg',
    '[]',
    '["Reduced stress", "Improved focus", "Better emotional regulation", "Increased self-awareness"]',
    'Published',
    true,
    true,
    'admin_002',
    2847,
    4.6,
    198
),

(
    'practice_002',
    'Loving-Kindness Meditation',
    'Traditional meditation for cultivating compassion and goodwill.',
    'Begin by sending loving-kindness to yourself: "May I be happy, may I be healthy, may I be at peace." Then extend these wishes to loved ones, neutral people, difficult people, and finally all beings everywhere.',
    20,
    3,
    5,
    'Meditation',
    'Intermediate',
    'Emotional Regulation',
    'Compassion Cultivation',
    'Eastern',
    'Mild',
    '["loving-kindness", "compassion", "metta", "traditional", "emotional healing"]',
    'https://cdn.mentalwellbeing.app/audio/loving-kindness-20min.mp3',
    'https://cdn.mentalwellbeing.app/images/loving-kindness-visual.jpg',
    '[]',
    '["Increased compassion", "Better relationships", "Reduced self-criticism", "Enhanced empathy"]',
    'Published',
    true,
    true,
    'admin_003',
    1654,
    4.8,
    124
),

-- Breathing Practices
(
    'practice_003',
    '4-7-8 Breathing for Anxiety',
    'Rapid anxiety relief through controlled breathing.',
    'Exhale completely through your mouth. Close your mouth and inhale through your nose for 4 counts. Hold your breath for 7 counts. Exhale through your mouth for 8 counts. Repeat this cycle 3-4 times.',
    5,
    1,
    2,
    'Breathing',
    'Beginner',
    'Stress Relief',
    'Anxiety Management',
    'Western',
    'Moderate',
    '["breathing", "anxiety", "4-7-8", "quick relief", "nervous system"]',
    'https://cdn.mentalwellbeing.app/audio/478-breathing.mp3',
    'https://cdn.mentalwellbeing.app/images/478-breathing-diagram.jpg',
    '[]',
    '["Rapid anxiety relief", "Calmed nervous system", "Better sleep", "Reduced panic symptoms"]',
    'Published',
    true,
    true,
    'admin_002',
    3721,
    4.7,
    287
),

(
    'practice_004',
    'Box Breathing for Focus',
    'Military-grade breathing technique for enhanced concentration.',
    'Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, hold empty for 4 counts. Visualize drawing a square with your breath. Maintain steady, controlled breathing throughout.',
    8,
    1,
    2,
    'Breathing',
    'Intermediate',
    'Focus',
    'Concentration',
    'Western',
    'Mild',
    '["box breathing", "focus", "concentration", "military", "tactical breathing"]',
    'https://cdn.mentalwellbeing.app/audio/box-breathing.mp3',
    'https://cdn.mentalwellbeing.app/images/box-breathing-visual.jpg',
    '[]',
    '["Enhanced focus", "Stress reduction", "Improved performance", "Mental clarity"]',
    'Published',
    true,
    false,
    'admin_003',
    1287,
    4.5,
    89
),

-- Yoga Practices
(
    'practice_005',
    'Gentle Morning Yoga Flow',
    'Energizing yoga sequence to start your day mindfully.',
    'Begin in child\'s pose for grounding. Move through cat-cow stretches to warm the spine. Flow through downward dog, forward fold, and gentle backbends. End in mountain pose with intention setting.',
    15,
    3,
    5,
    'Yoga',
    'Beginner',
    'Physical Wellness',
    'Morning Practice',
    'Eastern',
    'Mild',
    '["yoga", "morning", "gentle", "flow", "energizing", "mindful movement"]',
    'https://cdn.mentalwellbeing.app/audio/morning-yoga-guide.mp3',
    'https://cdn.mentalwellbeing.app/video/morning-yoga-demo.mp4',
    '["Yoga mat", "Comfortable clothing"]',
    '["Increased flexibility", "Better posture", "Enhanced energy", "Mindful start to day"]',
    'Published',
    true,
    true,
    'admin_002',
    2156,
    4.4,
    143
),

-- Sleep Practices
(
    'practice_006',
    'Progressive Sleep Relaxation',
    'Systematic relaxation practice for better sleep.',
    'Lie comfortably in bed. Starting with your toes, systematically tense and release each muscle group. Move slowly up your body, spending 5-10 seconds tensing each area, then releasing completely.',
    25,
    5,
    5,
    'Sleep',
    'Beginner',
    'Sleep',
    'Sleep Preparation',
    'Western',
    'Mild',
    '["sleep", "relaxation", "progressive", "muscle", "tension release", "bedtime"]',
    'https://cdn.mentalwellbeing.app/audio/sleep-relaxation.mp3',
    NULL,
    '["Comfortable bed", "Quiet environment"]',
    '["Better sleep quality", "Reduced muscle tension", "Faster sleep onset", "Deeper rest"]',
    'Published',
    true,
    true,
    'admin_003',
    1876,
    4.6,
    134
),

-- Advanced/Specialized Practices
(
    'practice_007',
    'Vipassana Insight Meditation',
    'Traditional insight meditation for deep self-awareness.',
    'Sit in meditation posture. Begin with breath awareness, then expand to observe all arising sensations, thoughts, and emotions without attachment. Notice the impermanent nature of all experiences.',
    45,
    10,
    10,
    'Meditation',
    'Advanced',
    'Spiritual Growth',
    'Insight Practice',
    'Eastern',
    'Mild',
    '["vipassana", "insight", "advanced", "mindfulness", "awareness", "buddhist"]',
    'https://cdn.mentalwellbeing.app/audio/vipassana-45min.mp3',
    'https://cdn.mentalwellbeing.app/images/vipassana-guide.jpg',
    '["Meditation cushion", "Timer", "Quiet space"]',
    '["Deep self-insight", "Emotional equanimity", "Spiritual growth", "Enhanced awareness"]',
    'Published',
    true,
    false,
    'admin_003',
    743,
    4.9,
    45
),

-- Draft Practice (for testing)
(
    'practice_008',
    'EMDR-Informed Bilateral Stimulation',
    'Specialized practice for trauma processing support.',
    'Gentle bilateral stimulation technique adapted from EMDR therapy for self-regulation and nervous system calming.',
    20,
    5,
    10,
    'Movement',
    'Advanced',
    'Trauma Recovery',
    'Nervous System Regulation',
    'Western',
    'Severe',
    '["EMDR", "bilateral", "trauma", "nervous system", "regulation", "specialized"]',
    NULL,
    NULL,
    '["Private space", "Professional guidance recommended"]',
    '["Nervous system regulation", "Trauma processing support", "Emotional stability"]',
    'Draft',
    false,
    false,
    'admin_003',
    0,
    NULL,
    0
);

-- ============================================================================
-- SEED PRACTICE SERIES
-- ============================================================================

-- Create sample practice series
INSERT INTO practice_series (
    id, title, description, total_sessions, recommended_frequency, estimated_duration,
    category, difficulty, approach, tags, overview, prerequisites,
    status, is_published, featured, created_by, enrollment_count, rating, rating_count
) VALUES
(
    'series_001',
    '7-Day Mindfulness Journey',
    'Complete introduction to mindfulness meditation over one week.',
    7,
    'Daily',
    7,
    'Beginner Program',
    'Beginner',
    'Hybrid',
    '["mindfulness", "beginner", "7-day", "foundation", "daily practice"]',
    'A structured 7-day program introducing mindfulness meditation. Each day builds on the previous, creating a solid foundation for ongoing practice.',
    'No prior meditation experience required',
    'Published',
    true,
    true,
    'admin_002',
    423,
    4.7,
    67
),
(
    'series_002',
    'Anxiety Mastery Program',
    '21-day comprehensive anxiety management program.',
    21,
    '3 times per week',
    21,
    'Stress Relief Course',
    'Intermediate',
    'Western',
    '["anxiety", "21-day", "comprehensive", "CBT", "breathing"]',
    'Comprehensive 21-day program combining breathing techniques, CBT exercises, and progressive relaxation for anxiety management.',
    'Basic understanding of anxiety helpful but not required',
    'Published',
    true,
    true,
    'admin_003',
    234,
    4.8,
    43
);

-- ============================================================================
-- SEED PRACTICE SERIES ITEMS
-- ============================================================================

-- 7-Day Mindfulness Journey items
INSERT INTO practice_series_items (id, series_id, practice_id, session_number, title, notes) VALUES
('series_item_001', 'series_001', 'practice_001', 1, 'Day 1: Foundation - Breath Awareness', 'Start with simple breath awareness'),
('series_item_002', 'series_001', 'practice_001', 2, 'Day 2: Deepening - Extended Breath Practice', 'Increase duration and awareness'),
('series_item_003', 'series_001', 'practice_002', 3, 'Day 3: Heart Opening - Loving-Kindness', 'Introduce compassion practice'),
('series_item_004', 'series_001', 'practice_001', 4, 'Day 4: Integration - Breath in Daily Life', 'Apply mindfulness throughout day'),
('series_item_005', 'series_001', 'practice_005', 5, 'Day 5: Body Awareness - Mindful Movement', 'Connect breath with gentle movement'),
('series_item_006', 'series_001', 'practice_002', 6, 'Day 6: Expanding Compassion', 'Deepen loving-kindness practice'),
('series_item_007', 'series_001', 'practice_001', 7, 'Day 7: Integration and Going Forward', 'Establish ongoing practice routine');

-- ============================================================================
-- SEED PLAYLISTS
-- ============================================================================

-- Create sample playlists
INSERT INTO playlists (
    id, title, description, category, subcategory, approach, difficulty, tags,
    estimated_duration, goals, status, is_published, featured, created_by
) VALUES
(
    'playlist_001',
    'Quick Stress Relief',
    'Fast-acting practices for immediate stress relief.',
    'Stress Management',
    'Quick Relief',
    'All',
    'Beginner',
    '["stress relief", "quick", "emergency", "breathing", "immediate"]',
    20,
    '["Immediate stress relief", "Emergency coping", "Quick reset"]',
    'Published',
    true,
    true,
    'admin_002'
),
(
    'playlist_002',
    'Deep Relaxation Collection',
    'Extended practices for deep relaxation and restoration.',
    'Relaxation',
    'Deep Practice',
    'Hybrid',
    'Intermediate',
    '["relaxation", "deep", "restoration", "extended", "healing"]',
    90,
    '["Deep relaxation", "Stress recovery", "Mental restoration"]',
    'Published',
    true,
    false,
    'admin_003'
);

-- ============================================================================
-- SEED USER SAMPLE DATA
-- ============================================================================

-- Create sample regular users for testing
INSERT INTO users (
    id, email, name, firstName, lastName, isOnboarded, approach, 
    dataConsent, createdAt, updatedAt
) VALUES
(
    'user_001',
    'john.doe@email.com',
    'John Doe',
    'John',
    'Doe',
    true,
    'Hybrid',
    true,
    datetime('now', '-30 days'),
    datetime('now', '-5 days')
),
(
    'user_002',
    'jane.smith@email.com',
    'Jane Smith',
    'Jane',
    'Smith',
    true,
    'Western',
    true,
    datetime('now', '-15 days'),
    datetime('now', '-2 days')
),
(
    'user_003',
    'mike.wilson@email.com',
    'Mike Wilson',
    'Mike',
    'Wilson',
    true,
    'Eastern',
    true,
    datetime('now', '-7 days'),
    datetime('now', '-1 day')
);

-- ============================================================================
-- SEED USER PRACTICE PROGRESS
-- ============================================================================

-- Sample practice progress for users
INSERT INTO user_practice_progress (
    id, user_id, practice_id, total_sessions, completed_sessions, total_minutes,
    current_streak, longest_streak, last_practice_date, is_favorite, average_rating
) VALUES
('progress_001', 'user_001', 'practice_001', 15, 12, 150, 5, 8, datetime('now', '-1 day'), true, 4.5),
('progress_002', 'user_001', 'practice_003', 8, 8, 40, 3, 5, datetime('now', '-2 days'), false, 4.8),
('progress_003', 'user_002', 'practice_002', 6, 4, 80, 2, 4, datetime('now', '-3 days'), true, 4.2),
('progress_004', 'user_003', 'practice_005', 10, 8, 120, 4, 6, datetime('now', '-1 day'), true, 4.6);

-- ============================================================================
-- SEED CONTENT AND PRACTICE RATINGS
-- ============================================================================

-- Sample content ratings
INSERT INTO content_ratings (id, user_id, content_id, rating, review) VALUES
('rating_c001', 'user_001', 'content_001', 5, 'Excellent introduction to mindfulness. Very clear and practical.'),
('rating_c002', 'user_002', 'content_003', 4, 'Good explanation of anxiety. Helped me understand my symptoms better.'),
('rating_c003', 'user_003', 'content_005', 5, 'Progressive muscle relaxation really works! Use it every night now.');

-- Sample practice ratings  
INSERT INTO practice_ratings (id, user_id, practice_id, rating, review, helpful, difficulty_rating, clarity_rating) VALUES
('rating_p001', 'user_001', 'practice_001', 5, 'Perfect for beginners. Clear instructions and very calming.', true, 2, 5),
('rating_p002', 'user_002', 'practice_003', 5, 'This breathing technique stops my panic attacks. Life-changing!', true, 1, 5),
('rating_p003', 'user_003', 'practice_005', 4, 'Nice morning routine. Helps me start the day mindfully.', true, 3, 4);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify admin users
SELECT COUNT(*) as admin_count FROM users WHERE isAdmin = true;

-- Verify content seeding
SELECT COUNT(*) as content_count, COUNT(CASE WHEN status = 'Published' THEN 1 END) as published_count FROM content;

-- Verify practice seeding
SELECT COUNT(*) as practice_count, COUNT(CASE WHEN is_published = true THEN 1 END) as published_practices FROM practices;

-- Verify practice series
SELECT COUNT(*) as series_count FROM practice_series;

-- Verify user progress data
SELECT COUNT(*) as progress_entries FROM user_practice_progress;

-- Verify ratings
SELECT 
    (SELECT COUNT(*) FROM content_ratings) as content_ratings_count,
    (SELECT COUNT(*) FROM practice_ratings) as practice_ratings_count;

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING ADMIN FUNCTIONALITY
-- ============================================================================

/*
-- Test admin content queries
SELECT * FROM content WHERE created_by = 'admin_002' ORDER BY created_at DESC;

-- Test practice management queries  
SELECT * FROM practices WHERE status = 'Draft';

-- Test user analytics
SELECT 
    u.name,
    COUNT(upp.id) as practices_tried,
    SUM(upp.total_minutes) as total_practice_time
FROM users u
LEFT JOIN user_practice_progress upp ON u.id = upp.user_id
WHERE u.isAdmin = false
GROUP BY u.id, u.name;

-- Test content performance
SELECT 
    c.title,
    c.view_count,
    c.rating,
    c.rating_count,
    COUNT(cr.id) as review_count
FROM content c
LEFT JOIN content_ratings cr ON c.id = cr.content_id
WHERE c.status = 'Published'
GROUP BY c.id
ORDER BY c.view_count DESC;
*/

-- Final seed status
SELECT 'DATABASE SEEDING COMPLETED SUCCESSFULLY' as seed_status;