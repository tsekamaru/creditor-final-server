const db = require('../db');
const bcrypt = require('bcrypt');

class Customer {
    // Get all customers with comprehensive information
    static async getAllCustomers() {
        try {
            const result = await db.query(`
                SELECT 
                    cd.user_id,
                    cd.social_security_number,
                    cd.first_name,
                    cd.last_name,
                    cd.date_of_birth,
                    cd.address,
                    cd.is_active,
                    cd.age,
                    u.phone_number,
                    u.email,
                    cd.created_at,
                    cd.updated_at
                FROM customer_details cd
                JOIN users u ON cd.user_id = u.id
                ORDER BY cd.user_id ASC
            `);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching customers: ' + error.message);
        }
    }

    // Get customer by ID with comprehensive information
    static async getCustomerById(id) {
        try {
            const result = await db.query(`
                SELECT 
                    cd.user_id,
                    cd.social_security_number,
                    cd.first_name,
                    cd.last_name,
                    cd.date_of_birth,
                    cd.address,
                    cd.is_active,
                    cd.age,
                    u.phone_number,
                    u.email,
                    cd.created_at,
                    cd.updated_at
                FROM customer_details cd
                JOIN users u ON cd.user_id = u.id
                WHERE cd.user_id = $1
            `, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching customer: ' + error.message);
        }
    }

    // Get all loans for a specific customer
    static async getCustomerLoans(customerId) {
        try {
            const result = await db.query(`
                SELECT 
                    ld.id,
                    ld.customer_id,
                    ld.loan_period,
                    ld.extension_days,
                    ld.waiting_days,
                    ld.start_date,
                    ld.extension_date,
                    ld.end_date,
                    ld.default_date,
                    ld.interest_rate,
                    ld.overdue_rate,
                    ld.loan_amount,
                    ld.paid_amount,
                    ld.paid_interest,
                    ld.remaining_days,
                    ld.interest_days,
                    ld.overdue_days,
                    ld.principle_amount,
                    ld.interest_amount,
                    ld.overdue_amount,
                    ld.total_amount,
                    ld.current_status,
                    ld.created_at,
                    ld.updated_at
                FROM loan_details ld
                WHERE ld.customer_id = $1
                ORDER BY ld.created_at DESC
            `, [customerId]);
            
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching customer loans: ' + error.message);
        }
    }
    
    // Create new customer with user creation
    static async createCustomer(customerData) {
        const {
            social_security_number,
            first_name,
            last_name,
            date_of_birth,
            address,
            phone_number,
            email,
            password
        } = customerData;

        try {
            // Start transaction
            await db.query('BEGIN');

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // First create the user with fixed role 'customer'
            const userResult = await db.query(
                `INSERT INTO users (phone_number, email, password_hash, role)
                VALUES ($1, $2, $3, 'customer')
                RETURNING id`,
                [phone_number, email, hashedPassword]
            );
            const user_id = userResult.rows[0].id;

            // Then create the customer
            const customerResult = await db.query(
                `INSERT INTO customers (
                    user_id, social_security_number, first_name, last_name, 
                    date_of_birth, address
                ) VALUES ($1, $2, $3, $4, $5::DATE, $6)
                RETURNING *`,
                [user_id, social_security_number, first_name, last_name, date_of_birth, address]
            );

            // Commit transaction
            await db.query('COMMIT');
            return customerResult.rows[0];
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            throw new Error('Error creating customer: ' + error.message);
        }
    }

    // Update customer
    static async updateCustomer(id, customerData) {
        const {
            social_security_number,
            first_name,
            last_name,
            date_of_birth,
            address
        } = customerData;

        try {
            const result = await db.query(
                `UPDATE customers 
                SET social_security_number = $1,
                    first_name = $2,
                    last_name = $3,
                    date_of_birth = $4::DATE,
                    address = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $6
                RETURNING *`,
                [social_security_number, first_name, last_name, date_of_birth, address, id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error updating customer: ' + error.message);
        }
    }

    // Delete customer
    static async deleteCustomer(id) {
        try {
            const result = await db.query(
                'DELETE FROM customers WHERE user_id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error deleting customer: ' + error.message);
        }
    }
}

module.exports = Customer; 