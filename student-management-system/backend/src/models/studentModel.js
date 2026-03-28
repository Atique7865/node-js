const pool = require('../config/db');

// Get all students (with optional search)
const getAllStudents = async (search = '') => {
  let query = 'SELECT * FROM students';
  const params = [];

  if (search) {
    query += ` WHERE first_name ILIKE $1
                  OR last_name  ILIKE $1
                  OR email      ILIKE $1
                  OR subject    ILIKE $1`;
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

// Get student by ID
const getStudentById = async (id) => {
  const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
  return result.rows[0];
};

// Create a new student
const createStudent = async (data) => {
  const { first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date } = data;
  const result = await pool.query(
    `INSERT INTO students (first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date]
  );
  return result.rows[0];
};

// Update an existing student
const updateStudent = async (id, data) => {
  const { first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date } = data;
  const result = await pool.query(
    `UPDATE students
     SET first_name = $1, last_name = $2, email = $3, phone = $4,
         date_of_birth = $5, grade = $6, subject = $7, enrollment_date = $8
     WHERE id = $9
     RETURNING *`,
    [first_name, last_name, email, phone, date_of_birth, grade, subject, enrollment_date, id]
  );
  return result.rows[0];
};

// Delete a student
const deleteStudent = async (id) => {
  const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// Get dashboard statistics
const getStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*)                                          AS total_students,
      COUNT(DISTINCT subject)                           AS total_subjects,
      COUNT(*) FILTER (WHERE grade LIKE 'A%')          AS a_grade_students,
      COUNT(*) FILTER (WHERE enrollment_date >= NOW() - INTERVAL '30 days') AS new_this_month
    FROM students
  `);
  return result.rows[0];
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStats };
