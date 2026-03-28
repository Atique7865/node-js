const Student = require('../models/studentModel');

// GET /api/students  or  GET /api/students?search=term
const getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const students = await Student.getAllStudents(search || '');
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    console.error('getAllStudents error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error('getStudentById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/students
const createStudent = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'first_name, last_name, and email are required' });
    }
    const student = await Student.createStudent(req.body);
    res.status(201).json({ success: true, message: 'Student created', data: student });
  } catch (err) {
    console.error('createStudent error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const student = await Student.updateStudent(req.params.id, req.body);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student updated', data: student });
  } catch (err) {
    console.error('updateStudent error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.deleteStudent(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deleted', data: student });
  } catch (err) {
    console.error('deleteStudent error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/stats
const getStats = async (req, res) => {
  try {
    const stats = await Student.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStats };
