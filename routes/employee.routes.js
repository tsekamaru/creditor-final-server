const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee.model');
const { verifyToken, isAdmin } = require('../middleware/jwtAuth');

// GET /employees - Get all employees (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const employees = await Employee.getAllEmployees();
        res.json({
            success: true,
            employees
        });
    } catch (error) {
        next(error);
    }
});

// GET /employees/:id - Get single employee
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        // Users can only view their own profile unless they're admin
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only view your own profile.' 
            });
        }

        const employee = await Employee.getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }
        res.json({
            success: true,
            employee
        });
    } catch (error) {
        next(error);
    }
});

// POST /employees - Create new employee (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const newEmployee = await Employee.createEmployee(req.body);
        res.status(201).json({
            success: true,
            employee: newEmployee
        });
    } catch (error) {
        next(error);
    }
});

// PUT /employees/:id - Update employee
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        // Users can only update their own profile unless they're admin
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only update your own profile.' 
            });
        }

        const updatedEmployee = await Employee.updateEmployee(req.params.id, req.body);
        if (!updatedEmployee) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }
        res.json({
            success: true,
            employee: updatedEmployee
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /employees/:id - Delete employee (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const deletedEmployee = await Employee.deleteEmployee(req.params.id);
        if (!deletedEmployee) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }
        res.json({ 
            success: true,
            message: 'Employee deleted successfully', 
            employee: deletedEmployee 
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 