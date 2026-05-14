const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/:assignmentId/submit', [authMiddleware, roleMiddleware(['student']), upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { assignmentId } = req.params;
    const result = await pool.query(
      'INSERT INTO submissions (assignment_id, user_id, file_path, submitted_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [assignmentId, req.user.id, req.file.path]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assignment/:assignmentId', [authMiddleware], async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, u.name FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.assignment_id = $1',
      [req.params.assignmentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:submissionId/grade', [authMiddleware, roleMiddleware(['teacher']),
  body('grade').isNumeric().custom(v => v >= 0 && v <= 100),
  body('feedback').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { grade, feedback } = req.body;
    const result = await pool.query(
      'UPDATE submissions SET grade = $1, feedback = $2 WHERE id = $3 RETURNING *',
      [grade, feedback || null, req.params.submissionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', [authMiddleware], async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, a.title FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.user_id = $1 ORDER BY s.submitted_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
