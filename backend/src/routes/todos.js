const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth'); // Import the middleware
const { Item, Value, Habit, Event, Todo } = require('../models/associations');
const { Op } = require('sequelize');

// POST new todo
router.post('/api/todos', requireAuth, async (req, res) => {
  try {
    // First create the base item
    const item = await Item.create({
      user_id: req.session.user.id,
      type: 'todo'
    });

    const { content, type, parent_id } = req.body;
    
    const todo = await Todo.create({
      item_id: item.id,
      content,
      type,
      parent_id,
      completed: false
    });

    // Return the todo with its item data
    const fullTodo = await Todo.findByPk(todo.item_id, {
      include: [
        {
          model: Item,
          attributes: ['created_at']
        },
        {
          model: Event,
          attributes: ['description']
        },
        {
          model: Value,
          attributes: ['description', 'color']
        }
      ]
    });

    res.status(201).json(fullTodo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET completed todos for the current user
router.get('/api/todos/completed', requireAuth, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }],
      where: { completed: true }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET completed todos for today without events for the current user
router.get('/api/todos/completed/today/noevent', requireAuth, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }],
      where: { 
        completed: true, 
        updated_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }, 
        parent_id: null 
      }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET incomplete todos for the current user
router.get('/api/todos/incomplete', requireAuth, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      include: [
        {
          model: Item,
          where: { user_id: req.session.user.id },
          required: true
        },
        {
          model: Value,
          attributes: ['item_id', 'description', 'color']
        },
        {
          model: Habit,
          attributes: ['item_id', 'description'],
          include: [{
            model: Value,
            attributes: ['item_id', 'description', 'color']
          }]
        }
      ],
      where: { completed: false }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET incomplete todos for a specific habit for the current user
router.get('/api/todos/incomplete/habit/:id', requireAuth, async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Must provide a number for habit ID' });
    }

    const todos = await Todo.findAll({
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }],
      where: { 
        completed: false,
        type: 'habit',
        parent_id: habitId
      }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET incomplete todos for a specific value for the current user
router.get('/api/todos/incomplete/value/:id' , requireAuth, async (req, res) => {
  try {
    const valueId = parseInt(req.params.id);
    if (isNaN(valueId)) {
      return res.status(400).json({ error: 'Must provide a number for value ID' });
    }

    const todos = await Todo.findAll({
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }],
      where: { 
        completed: false,
        type: 'value',
        parent_id: valueId
      }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE todo completion status
router.patch('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { item_id: req.params.id },
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }]
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { completed } = req.body;
    await todo.update({ completed });

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE todo
router.delete('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { item_id: req.params.id },
      include: [{
        model: Item,
        where: { user_id: req.session.user.id },
        required: true
      }]
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Find the associated item
    const item = await Item.findByPk(todo.item_id);
    
    // Delete both the todo and its item
    await todo.destroy();
    if (item) {
      await item.destroy();
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 