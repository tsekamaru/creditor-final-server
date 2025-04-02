const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee.model');

// GET /employees - Get all employees (Admin only)
router.get('/', async (req, res, next) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ 
        //         message: 'Access denied. Only administrators can view all employees.' 
        //     });
        // }

        const employees = await Employee.getAllEmployees();
        res.json(employees);
    } catch (error) {
        next(error);
    }
});

// GET /employees/:id - Get single employee
router.get('/:id', async (req, res, next) => {
    try {
        // if (!req.user || (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin')) {
        //     return res.status(403).json({ 
        //         message: 'Access denied. You can only view your own profile.' 
        //     });
        // }

        const employee = await Employee.getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        next(error);
    }
});

// POST /employees - Create new employee
router.post('/', async (req, res, next) => {
    try {
        const newEmployee = await Employee.createEmployee(req.body);
        res.status(201).json(newEmployee);
    } catch (error) {
        next(error);
    }
});

// PUT /employees/:id - Update employee
router.put('/:id', async (req, res, next) => {
    try {
        // if (!req.user || (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin')) {
        //     return res.status(403).json({ 
        //         message: 'Access denied. You can only update your own profile.' 
        //     });
        // }

        const updatedEmployee = await Employee.updateEmployee(req.params.id, req.body);
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(updatedEmployee);
    } catch (error) {
        next(error);
    }
});

// DELETE /employees/:id - Delete employee (Admin only)
router.delete('/:id', async (req, res, next) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ 
        //         message: 'Access denied. Only administrators can delete employees.' 
        //     });
        // }

        const deletedEmployee = await Employee.deleteEmployee(req.params.id);
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 