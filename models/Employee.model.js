const db = require('../db');
const bcrypt = require('bcrypt');

class Employee {
    // Get all employees with comprehensive information
    static async getAllEmployees() {
        try {
            const result = await db.query(`
                SELECT 
                    e.user_id,
                    e.position,
                    e.first_name,
                    e.date_of_birth,
                    u.phone_number,
                    u.email,
                    e.created_at,
                    e.updated_at
                FROM employees e
                JOIN users u ON e.user_id = u.id
                ORDER BY e.user_id ASC
            `);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching employees: ' + error.message);
        }
    }

    // Get employee by ID with comprehensive information
    static async getEmployeeById(id) {
        try {
            const result = await db.query(`
                SELECT 
                    e.user_id,
                    e.position,
                    e.first_name,
                    e.date_of_birth,
                    u.phone_number,
                    u.email,
                    e.created_at,
                    e.updated_at
                FROM employees e
                JOIN users u ON e.user_id = u.id
                WHERE e.user_id = $1
            `, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching employee: ' + error.message);
        }
    }

    // Create new employee with user creation
    static async createEmployee(employeeData) {
        const {
            position,
            first_name,
            last_name,
            date_of_birth,
            phone_number,
            email,
            password
        } = employeeData;

        try {
            // Start transaction
            await db.query('BEGIN');

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // First create the user with fixed role 'employee' and hashed password
            const userResult = await db.query(
                `INSERT INTO users (phone_number, email, password_hash, role)
                VALUES ($1, $2, $3, 'employee')
                RETURNING id`,
                [phone_number, email, hashedPassword]
            );
            const user_id = userResult.rows[0].id;

            // Then create the employee with explicit DATE type casting
            const employeeResult = await db.query(
                `INSERT INTO employees (
                    user_id, position, first_name, last_name, date_of_birth
                ) VALUES ($1, $2, $3, $4, $5::DATE)
                RETURNING *`,
                [user_id, position, first_name, last_name, date_of_birth]
            );

            // Commit transaction
            await db.query('COMMIT');
            return employeeResult.rows[0];
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            throw new Error('Error creating employee: ' + error.message);
        }
    }

    // Update employee
    static async updateEmployee(id, employeeData) {
        const {
            position,
            first_name,
            last_name,
            date_of_birth
        } = employeeData;

        try {
            const result = await db.query(
                `UPDATE employees 
                SET position = $1,
                    first_name = $2,
                    last_name = $3,
                    date_of_birth = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $5
                RETURNING *`,
                [position, first_name, last_name, date_of_birth, id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error updating employee: ' + error.message);
        }
    }

    // Delete employee
    static async deleteEmployee(id) {
        try {
            const result = await db.query(
                'DELETE FROM employees WHERE user_id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error deleting employee: ' + error.message);
        }
    }
}

module.exports = Employee; 