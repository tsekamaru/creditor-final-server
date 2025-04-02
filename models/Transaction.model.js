const db = require('../db');

class Transaction {
    // Get all transactions with comprehensive information
    static async getAllTransactions() {
        try {
            const result = await db.query(`
                SELECT 
                    td.id,
                    td.transaction_amount,
                    td.transaction_purpose,
                    td.loan_id,
                    td.employee_id,
                    td.customer_id,
                    td.transaction_direction,
                    td.principle_amount,
                    td.customer_first_name,
                    td.customer_last_name,
                    td.created_at,
                    td.updated_at
                FROM transaction_details td
                ORDER BY td.id ASC
            `);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching transactions: ' + error.message);
        }
    }

    // Get transaction by ID with comprehensive information
    static async getTransactionById(id) {
        try {
            const result = await db.query(`
                SELECT 
                    td.id,
                    td.transaction_amount,
                    td.transaction_purpose,
                    td.loan_id,
                    td.employee_id,
                    td.customer_id,
                    td.transaction_direction,
                    td.principle_amount,
                    td.customer_first_name,
                    td.customer_last_name,
                    td.created_at,
                    td.updated_at
                FROM transaction_details td
                WHERE td.id = $1
            `, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching transaction: ' + error.message);
        }
    }

    // Get all transactions for a specific customer
    static async getCustomerTransactions(customerId) {
        try {
            const result = await db.query(`
                SELECT 
                    td.id,
                    td.transaction_amount,
                    td.transaction_purpose,
                    td.loan_id,
                    td.employee_id,
                    td.customer_id,
                    td.transaction_direction,
                    td.principle_amount,
                    td.customer_first_name,
                    td.customer_last_name,
                    td.created_at,
                    td.updated_at
                FROM transaction_details td
                WHERE td.customer_id = $1
                ORDER BY td.created_at DESC
            `, [customerId]);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching customer transactions: ' + error.message);
        }
    }

    // Get all transactions for a specific loan
    static async getLoanTransactions(loanId) {
        try {
            const result = await db.query(`
                SELECT 
                    td.id,
                    td.transaction_amount,
                    td.transaction_purpose,
                    td.loan_id,
                    td.employee_id,
                    td.customer_id,
                    td.transaction_direction,
                    td.principle_amount,
                    td.customer_first_name,
                    td.customer_last_name,
                    td.created_at,
                    td.updated_at
                FROM transaction_details td
                WHERE td.loan_id = $1
                ORDER BY td.created_at DESC
            `, [loanId]);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching loan transactions: ' + error.message);
        }
    }

    // Create new transaction
    static async createTransaction(transactionData) {
        const {
            transaction_amount,
            transaction_purpose,
            loan_id,
            employee_id
        } = transactionData;

        try {
            // Get loan details to validate and get principle_amount and customer_id
            const loanResult = await db.query(
                `SELECT l.customer_id, ld.principle_amount, l.paid_amount, l.paid_interest
                FROM loans l
                JOIN loan_details ld ON l.id = ld.id
                WHERE l.id = $1`,
                [loan_id]
            );

            if (loanResult.rows.length === 0) {
                throw new Error('Loan not found');
            }

            // Get the original principle amount from the loan
            const originalPrincipleAmount = Number(loanResult.rows[0].principle_amount);
            
            // Calculate the new principle amount after payment
            let newPrincipleAmount = originalPrincipleAmount;
            if (transaction_purpose === 'loan_principle_payment') {
                newPrincipleAmount = originalPrincipleAmount - Number(transaction_amount);
            }

            // Create transaction with new principle amount
            const result = await db.query(
                `INSERT INTO transactions (
                    transaction_amount,
                    transaction_purpose,
                    loan_id,
                    employee_id,
                    customer_id,
                    principle_amount
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    transaction_amount,
                    transaction_purpose,
                    loan_id,
                    employee_id,
                    loanResult.rows[0].customer_id,
                    newPrincipleAmount  // Store the new principle amount in transaction
                ]
            );

            // Update loan's paid_amount and paid_interest based on transaction purpose
            let updateQuery = '';
            let updateParams = [];

            if (transaction_purpose === 'loan_principle_payment') {
                updateQuery = `
                    UPDATE loans 
                    SET paid_amount = paid_amount + $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `;
                updateParams = [transaction_amount, loan_id];
            } else if (transaction_purpose === 'loan_interest_payment') {
                updateQuery = `
                    UPDATE loans 
                    SET paid_interest = paid_interest + $1,
                        extension_date = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `;
                updateParams = [transaction_amount, loan_id];
            }

            if (updateQuery) {
                await db.query(updateQuery, updateParams);
            }

            return result.rows[0];
        } catch (error) {
            throw new Error('Error creating transaction: ' + error.message);
        }
    }

    // Update transaction
    static async updateTransaction(id, transactionData) {
        const {
            transaction_amount,
            transaction_purpose,
            loan_id,
            employee_id,
            customer_id,
            principle_amount
        } = transactionData;

        try {
            const result = await db.query(
                `UPDATE transactions 
                SET transaction_amount = $1,
                    transaction_purpose = $2,
                    loan_id = $3,
                    employee_id = $4,
                    customer_id = $5,
                    principle_amount = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *`,
                [transaction_amount, transaction_purpose, loan_id, employee_id, customer_id, principle_amount, id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error updating transaction: ' + error.message);
        }
    }

    // Delete transaction
    static async deleteTransaction(id) {
        try {
            const result = await db.query(
                'DELETE FROM transactions WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error deleting transaction: ' + error.message);
        }
    }
}

module.exports = Transaction; 