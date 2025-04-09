const db = require('../db');
const bcrypt = require('bcrypt');

class User {
    // Get all users
    static async getAllUsers() {
        try {
            const result = await db.query('SELECT id, role, phone_number, email, created_at, updated_at FROM users');
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching users: ' + error.message);
        }
    }

    // Get user by ID
    static async getUserById(id) {
        try {
            const result = await db.query(
                'SELECT id, role, phone_number, email, created_at, updated_at FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching user: ' + error.message);
        }
    }

    // Create new user
    static async createUser(userData) {
        const {
            role,
            phone_number,
            email,
            password
        } = userData;

        try {
            // Hash the password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            const result = await db.query(
                `INSERT INTO users (role, phone_number, email, password_hash)
                VALUES ($1, $2, $3, $4)
                RETURNING id, role, phone_number, email, created_at, updated_at`,
                [role, phone_number, email, password_hash]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error creating user: ' + error.message);
        }
    }

    // Update user
    static async updateUser(id, userData) {
        const {
            role,
            phone_number,
            email,
            password
        } = userData;

        try {
            let query = `
                UPDATE users 
                SET role = $1,
                    phone_number = $2,
                    email = $3
            `;
            let params = [role, phone_number, email];

            // Only update password if provided
            if (password) {
                const saltRounds = 10;
                const password_hash = await bcrypt.hash(password, saltRounds);
                query += `, password_hash = $${params.length + 1}`;
                params.push(password_hash);
            }

            query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1} RETURNING id, role, phone_number, email, created_at, updated_at`;
            params.push(id);

            const result = await db.query(query, params);
            return result.rows[0];
        } catch (error) {
            throw new Error('Error updating user: ' + error.message);
        }
    }

    // Delete user
    static async deleteUser(id) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN'); // Start transaction

            // First check if user exists
            const userCheck = await client.query('SELECT role FROM users WHERE id = $1', [id]);
            if (userCheck.rows.length === 0) {
                throw new Error('User not found');
            }
            
            const userRole = userCheck.rows[0].role;
            
            // Delete based on role - each role has its own related table
            if (userRole === 'customer') {
                // First check for and delete any related loans/transactions
                const customerLoans = await client.query('SELECT id FROM loans WHERE customer_id = $1', [id]);
                
                // Delete transactions related to each loan
                for (const loan of customerLoans.rows) {
                    await client.query('DELETE FROM transactions WHERE loan_id = $1', [loan.id]);
                }
                
                // Delete all loans for this customer
                await client.query('DELETE FROM loans WHERE customer_id = $1', [id]);
                
                // Delete customer record
                await client.query('DELETE FROM customers WHERE user_id = $1', [id]);
            } else if (userRole === 'employee') {
                // Delete employee record
                await client.query('DELETE FROM employees WHERE user_id = $1', [id]);
            }
            
            // Finally delete the user
            const result = await client.query(
                'DELETE FROM users WHERE id = $1 RETURNING id, role, phone_number, email, created_at, updated_at',
                [id]
            );
            
            await client.query('COMMIT'); // Commit transaction
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK'); // Rollback on error
            throw new Error('Error deleting user: ' + error.message);
        } finally {
            client.release(); // Release client back to pool
        }
    }

    // Authenticate user
    static async authenticateUser(phone_number, password) {
        try {
            const result = await db.query(
                'SELECT * FROM users WHERE phone_number = $1',
                [phone_number]
            );
            const user = result.rows[0];

            if (user && await bcrypt.compare(password, user.password_hash)) {
                return {
                    id: user.id,
                    role: user.role,
                    phone_number: user.phone_number,
                    email: user.email
                };
            }
            return null;
        } catch (error) {
            throw new Error('Error authenticating user: ' + error.message);
        }
    }
}

module.exports = User; 