const db = require('../db');

class Loan {
    // Fetches all loans with their complete details from the loan_details view
    static async getAllLoans() {
        try {
            const result = await db.query('SELECT * FROM loan_details');
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching loans: ' + error.message);
        }
    }

    // Retrieves a specific loan by ID with complete details
    static async getLoanById(id) {
        try {
            const result = await db.query('SELECT * FROM loan_details WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Error fetching loan: ' + error.message);
        }
    }

    // Creates a new loan record in the database
    static async createLoan(loanData) {
        const {
            customer_id,
            loan_amount
        } = loanData;

        try {
            const result = await db.query(
                `INSERT INTO loans (
                    customer_id, loan_amount
                ) VALUES ($1, $2)
                RETURNING *`,
                [customer_id, loan_amount]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error creating loan: ' + error.message);
        }
    }

    // Processes a loan payment, creates transaction records, and updates loan amounts
    static async updateLoanViaPayment(id, loanData) {
        const {
            principle_payment,  // New payment being made towards the principle
            interest_payment,   // New payment being made towards interest (must have exactly 2 decimal places)
            customer_id        // Customer ID remains the same as it's a direct match
        } = loanData;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');  // Start transaction

            // 1. Get loan details and validate customer_id and interest payment
            const loanDetails = await client.query(
                `SELECT l.customer_id, ld.interest_amount, ld.paid_interest, ld.principle_amount 
                FROM loans l
                JOIN loan_details ld ON l.id = ld.id
                WHERE l.id = $1`,
                [id]
            );

            // Validate both customer_id and interest payment
            if (loanDetails.rows[0].customer_id !== customer_id) {
                throw new Error(`Invalid customer_id. Loan belongs to customer: ${loanDetails.rows[0].customer_id}, Provided: ${customer_id}`);
            }

            // Convert database string to number for comparison
            const requiredInterest = Number(loanDetails.rows[0].interest_amount);
            if (requiredInterest !== interest_payment) {
                throw new Error(`Invalid interest payment. Required: ${requiredInterest}, Provided: ${interest_payment}`);
            }

            // 2. Create transaction record for interest payment
            await client.query(
                `INSERT INTO transactions 
                (loan_id, customer_id, transaction_amount, transaction_purpose, principle_amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [id, customer_id, interest_payment, 'loan_interest_payment', loanDetails.rows[0].principle_amount]
            );

            // 3. Create transaction record for principle payment
            const updatedPrincipleAmount = Number(loanDetails.rows[0].principle_amount) - principle_payment;
            await client.query(
                `INSERT INTO transactions 
                (loan_id, customer_id, transaction_amount, transaction_purpose, principle_amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [id, customer_id, principle_payment, 'loan_principle_payment', updatedPrincipleAmount]
            );

            // 4. Get current loan amounts
            const currentLoan = await client.query(
                `SELECT paid_amount, paid_interest 
                FROM loans 
                WHERE id = $1`,
                [id]
            );

            // 5. Calculate new accumulated amounts
            const currentPaidAmount = Number(currentLoan.rows[0].paid_amount);
            const currentPaidInterest = Number(currentLoan.rows[0].paid_interest);
            
            const newPaidAmount = currentPaidAmount + principle_payment;
            const newPaidInterest = currentPaidInterest + interest_payment;

            // 6. Update the loan with accumulated amounts and new extension date
            await client.query(
                `UPDATE loans 
                SET paid_amount = $1,
                    paid_interest = $2,
                    extension_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3`,
                [newPaidAmount, newPaidInterest, id]
            );

            // 7. Get the complete loan details after update
            const updatedLoanDetails = await client.query(
                `SELECT * FROM loan_details WHERE id = $1`,
                [id]
            );

            await client.query('COMMIT');  // Commit transaction
            return updatedLoanDetails.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');  // Rollback on error
            throw new Error('Error updating loan via payment: ' + error.message);
        } finally {
            client.release();  // Release the client back to the pool
        }
    }

    // Updates an existing loan's details with new information
    static async updateLoan(id, loanData) {
        const {
            customer_id,
            start_date,
            extension_date,
            loan_amount
        } = loanData;

        try {
            const result = await db.query(
                `UPDATE loans 
                SET customer_id = $1,
                    start_date = $2,
                    extension_date = $3,
                    loan_amount = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *`,
                [customer_id, start_date, extension_date, loan_amount, id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error updating loan: ' + error.message);
        }
    }

    // Deletes a loan and its related records
    static async deleteLoan(id) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');  // Start transaction

            // First delete related transactions
            await client.query(
                'DELETE FROM transactions WHERE loan_id = $1',
                [id]
            );

            // Then delete the loan
            const result = await client.query(
                'DELETE FROM loans WHERE id = $1 RETURNING *',
                [id]
            );

            await client.query('COMMIT');  // Commit transaction
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');  // Rollback on error
            throw new Error('Error deleting loan: ' + error.message);
        } finally {
            client.release();  // Release the client back to the pool
        }
    }
}

module.exports = Loan; 