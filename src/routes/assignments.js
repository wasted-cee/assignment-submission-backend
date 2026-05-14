const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

router.post('/', [authMiddleware, roleMiddleware(['teacher']), 
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('deadline').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, description, deadline } = req.body;
    const result = await pool.query(
      'INSERT INTO assignments (title, description, created_by, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, req.user.id, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assignments ORDER BY deadline ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', [authMiddleware, roleMiddleware(['teacher']),
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('deadline').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, description, deadline } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (deadline) {
      updates.push(`deadline = $${paramCount++}`);
      values.push(deadline);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);
    
    const result = await pool.query(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', [authMiddleware, roleMiddleware(['teacher'])], async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM assignments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
