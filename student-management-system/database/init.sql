-- Student Management System - Database Initialization Script

-- Create the database (run this manually if needed: CREATE DATABASE student_management;)

-- Connect to the database: \c student_management

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100)  NOT NULL,
    last_name   VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  UNIQUE NOT NULL,
    phone       VARCHAR(20),
    date_of_birth DATE,
    grade       VARCHAR(10),
    subject     VARCHAR(100),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date)
VALUES
    ('Alice',   'Johnson',  'alice.johnson@example.com',  '555-0101', '2001-03-15', 'A',  'Mathematics', '2023-09-01'),
    ('Bob',     'Smith',    'bob.smith@example.com',      '555-0102', '2000-07-22', 'B+', 'Physics',     '2023-09-01'),
    ('Carol',   'Williams', 'carol.williams@example.com', '555-0103', '2002-01-10', 'A-', 'Chemistry',   '2023-09-01'),
    ('David',   'Brown',    'david.brown@example.com',    '555-0104', '2001-11-05', 'B',  'Biology',     '2024-01-15'),
    ('Eva',     'Davis',    'eva.davis@example.com',      '555-0105', '2000-05-30', 'A+', 'Computer Science', '2024-01-15')
ON CONFLICT (email) DO NOTHING;
