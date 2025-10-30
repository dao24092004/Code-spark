-- Sample data for the Course Service

-- Create a sample course
INSERT INTO cm_courses (id, instructor_id, title, slug, description, thumbnail_url, visibility, created_at, updated_at)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Introduction to Java Programming', 'java-programming-101', 'A beginner-friendly course on Java programming.', 'http://example.com/thumbnail.jpg', 'PUBLIC', NOW(), NOW());

-- Add some materials to the course
INSERT INTO cm_materials (id, course_id, title, type, content, display_order, created_at)
VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chapter 1: Introduction', 'TEXT', 'This is the content of chapter 1.', 1, NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chapter 2: Variables and Data Types', 'VIDEO', 'https://www.youtube.com/watch?v=example', 2, NOW());

-- Create a quiz for the course
INSERT INTO cm_quizzes (id, course_id, title, description, time_limit_minutes, created_at)
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quiz 1: Java Basics', 'A quiz to test your knowledge of basic Java concepts.', 15, NOW());

-- Add questions to the quiz
INSERT INTO cm_questions (id, quiz_id, content, type, display_order)
VALUES
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'What is the main method signature in Java?', 'SINGLE_CHOICE', 1),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Which of the following are primitive data types in Java?', 'MULTIPLE_CHOICE', 2);

-- Add options to the questions
INSERT INTO cm_question_options (id, question_id, content, is_correct)
VALUES
    -- Options for question 1
    ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'public static void main(String[] args)', true),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'public void main(String[] args)', false),
    ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'private static void main(String[] args)', false),

    -- Options for question 2
    ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'int', true),
    ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'String', false),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'boolean', true);
