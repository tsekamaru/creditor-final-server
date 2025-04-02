-- =============================================
-- User Management Section
-- =============================================

-- Create user role enum type
CREATE TYPE user_role AS ENUM ('customer', 'employee', 'admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Employee Management Section
-- =============================================

-- Create employee position enum type
CREATE TYPE employee_position AS ENUM ('teller', 'manager', 'director');

-- Create employees table
CREATE TABLE employees (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    position employee_position NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Customer Management Section
-- =============================================

-- Create function to calculate age
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql;

-- Create customers table
CREATE TABLE customers (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    social_security_number VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    address VARCHAR(400) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for customers updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for customers with dynamic age
CREATE OR REPLACE VIEW customer_details AS
SELECT 
    c.user_id,
    c.social_security_number,
    c.first_name,
    c.last_name,
    c.date_of_birth,
    c.address,
    calculate_age(c.date_of_birth) as age,
    c.created_at,
    c.updated_at,
    EXISTS (
        SELECT 1 
        FROM loan_details 
        WHERE customer_id = c.user_id
        AND current_status = 'active'
    ) as is_active
FROM customers c;

-- =============================================
-- Loan Management Section
-- =============================================

-- Create loan status enum type
CREATE TYPE loan_status AS ENUM ('active', 'paid', 'defaulted');

-- Create function to calculate loan dates
CREATE OR REPLACE FUNCTION calculate_loan_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate end_date
    NEW.end_date := NEW.extension_date + NEW.loan_period + NEW.extension_days;
    
    -- Calculate default_date
    NEW.default_date := NEW.extension_date + NEW.loan_period + NEW.extension_days + NEW.waiting_days;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create loans table
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(user_id),
    loan_period INTEGER NOT NULL DEFAULT 30,
    extension_days INTEGER NOT NULL DEFAULT 0,
    waiting_days INTEGER NOT NULL DEFAULT 90,
    start_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP)::DATE,
    extension_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP)::DATE,
    end_date DATE NOT NULL,
    default_date DATE NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 4.50,
    overdue_rate DECIMAL(5,2) NOT NULL DEFAULT 6.00,
    loan_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_interest DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for loans dates
CREATE TRIGGER calculate_loan_dates_trigger
    BEFORE INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION calculate_loan_dates();

-- Create trigger for loans updated_at
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for loans with dynamic calculations
CREATE OR REPLACE VIEW loan_details AS
WITH base_calculations AS (
    SELECT 
        l.*,
        -- Calculate dynamic fields based on current date
        CEIL(GREATEST(0, l.end_date - CURRENT_DATE))::INTEGER AS remaining_days,
        CEIL(LEAST(CURRENT_DATE, l.end_date) - l.extension_date)::INTEGER AS interest_days,
        CEIL(LEAST(GREATEST(0, CURRENT_DATE - l.end_date), l.waiting_days))::INTEGER AS overdue_days,
        l.loan_amount - l.paid_amount AS principle_amount
    FROM loans AS l
)
SELECT 
    b.*,
    ROUND(b.principle_amount * b.interest_days * b.interest_rate / 30 / 100, 2) AS interest_amount,
    ROUND(b.principle_amount * b.overdue_days * b.overdue_rate / 30 / 100, 2) AS overdue_amount,
    b.principle_amount + 
    ROUND(b.principle_amount * b.interest_days * b.interest_rate / 30 / 100, 2) + 
    ROUND(b.principle_amount * b.overdue_days * b.overdue_rate / 30 / 100, 2) AS total_amount,
    -- Calculate dynamic loan status
    CASE 
        WHEN b.principle_amount <= 0 THEN 'paid'
        WHEN CURRENT_DATE > b.default_date THEN 'defaulted'
        ELSE 'active'
    END AS current_status
FROM base_calculations AS b;

-- =============================================
-- Transaction Management Section
-- =============================================

-- Create transaction purpose enum type
CREATE TYPE transaction_purpose AS ENUM (
    'loan_principle_payment',
    'loan_interest_payment',
    'loan_give_out'
);

-- Create transaction direction enum type
CREATE TYPE transaction_direction AS ENUM (
    'in',
    'out'
);

-- Create function to calculate transaction direction
CREATE OR REPLACE FUNCTION derive_transaction_direction()
RETURNS TRIGGER AS $$
BEGIN
    -- Set transaction_direction based on transaction_purpose
    NEW.transaction_direction := CASE 
        WHEN NEW.transaction_purpose = 'loan_give_out' THEN 'out'::transaction_direction
        WHEN NEW.transaction_purpose = 'loan_principle_payment' THEN 'in'::transaction_direction
        WHEN NEW.transaction_purpose = 'loan_interest_payment' THEN 'in'::transaction_direction
    END;
    
    IF NEW.transaction_direction IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'Invalid transaction purpose: ' || NEW.transaction_purpose;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_amount DECIMAL(12,2) NOT NULL,
    transaction_purpose transaction_purpose NOT NULL,
    loan_id INTEGER REFERENCES loans(id) NOT NULL,
    employee_id INTEGER REFERENCES employees(user_id),
    customer_id INTEGER NOT NULL REFERENCES customers(user_id),
    transaction_direction transaction_direction NOT NULL,
    principle_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for transaction direction
CREATE TRIGGER derive_transaction_direction_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION derive_transaction_direction();

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for transactions with related information
CREATE VIEW transaction_details AS
SELECT 
    t.id,
    t.transaction_amount,
    t.transaction_purpose,
    t.loan_id,
    t.employee_id,
    t.customer_id,
    t.transaction_direction,
    t.principle_amount,
    t.created_at,
    t.updated_at,
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name
FROM transactions AS t
LEFT JOIN customers AS c ON t.customer_id = c.user_id;

