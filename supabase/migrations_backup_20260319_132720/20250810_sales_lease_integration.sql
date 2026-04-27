-- Sales & Lease Integration Migration
-- Adds comprehensive support for both property sales and leases
-- Including land plots, buyer management, and transaction types

-- 1. Add transaction types and enhanced property categories
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'LEASE' CHECK (transaction_type IN ('SALE', 'LEASE')),
ADD COLUMN IF NOT EXISTS property_category TEXT DEFAULT 'RESIDENTIAL' CHECK (property_category IN ('RESIDENTIAL', 'COMMERCIAL', 'LAND', 'INDUSTRIAL')),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS lease_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS land_size_sqft DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS land_size_acres DECIMAL(8,4),
ADD COLUMN IF NOT EXISTS development_status TEXT DEFAULT 'DEVELOPED' CHECK (development_status IN ('RAW_LAND', 'SURVEYED', 'TITLED', 'DEVELOPED', 'UNDER_DEVELOPMENT')),
ADD COLUMN IF NOT EXISTS title_document_url TEXT,
ADD COLUMN IF NOT EXISTS survey_plan_url TEXT,
ADD COLUMN IF NOT EXISTS c_of_o_url TEXT, -- Certificate of Occupancy
ADD COLUMN IF NOT EXISTS deed_of_assignment_url TEXT,
ADD COLUMN IF NOT EXISTS payment_plan_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS installment_months INTEGER,
ADD COLUMN IF NOT EXISTS down_payment_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS market_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS last_valuation_date DATE,
ADD COLUMN IF NOT EXISTS zoning_type TEXT,
ADD COLUMN IF NOT EXISTS land_use_permit_url TEXT;

-- 2. Create buyers table for sales transactions
CREATE TABLE IF NOT EXISTS buyers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'Lagos',
    country TEXT DEFAULT 'Nigeria',
    date_of_birth DATE,
    occupation TEXT,
    employer TEXT,
    monthly_income DECIMAL(12,2),
    preferred_budget_min DECIMAL(15,2),
    preferred_budget_max DECIMAL(15,2),
    preferred_locations TEXT[], -- Array of preferred locations
    preferred_property_types TEXT[], -- Array of preferred property types
    financing_method TEXT CHECK (financing_method IN ('CASH', 'MORTGAGE', 'INSTALLMENT', 'MIXED')),
    pre_approved_amount DECIMAL(15,2),
    bank_name TEXT,
    loan_officer_contact TEXT,
    identification_type TEXT CHECK (identification_type IN ('NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD')),
    identification_number TEXT,
    identification_document_url TEXT,
    proof_of_income_url TEXT,
    bank_statement_url TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'QUALIFIED', 'UNQUALIFIED')),
    lead_source TEXT,
    assigned_agent_id UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create sales transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES profiles(id) NOT NULL, -- Property owner
    agent_id UUID REFERENCES profiles(id),
    transaction_type TEXT DEFAULT 'SALE' CHECK (transaction_type IN ('SALE', 'LEASE_TO_OWN')),
    sale_price DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2),
    financing_amount DECIMAL(15,2),
    payment_method TEXT CHECK (payment_method IN ('CASH', 'MORTGAGE', 'INSTALLMENT', 'BANK_TRANSFER')),
    installment_plan JSONB, -- Store installment schedule
    agent_commission_rate DECIMAL(5,2) DEFAULT 2.5,
    agent_commission_amount DECIMAL(12,2),
    platform_fee_rate DECIMAL(5,2) DEFAULT 1.0,
    platform_fee_amount DECIMAL(12,2),
    legal_fee DECIMAL(12,2),
    survey_fee DECIMAL(12,2),
    registration_fee DECIMAL(12,2),
    other_fees JSONB, -- Store additional fees
    total_transaction_cost DECIMAL(15,2),
    contract_start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    contract_document_url TEXT,
    deed_of_assignment_url TEXT,
    receipt_of_payment_url TEXT,
    status TEXT DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'UNDER_NEGOTIATION', 'CONTRACT_SIGNED', 'PAYMENT_PENDING', 'PAYMENT_PARTIAL', 'PAYMENT_COMPLETE', 'TITLE_TRANSFER_PENDING', 'COMPLETED', 'CANCELLED')),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create sales payments table for installment tracking
CREATE TABLE IF NOT EXISTS sales_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE NOT NULL,
    payment_number INTEGER NOT NULL, -- 1st payment, 2nd payment, etc.
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    payment_method TEXT CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'MOBILE_MONEY')),
    reference_number TEXT,
    bank_name TEXT,
    receipt_url TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED')),
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create property inquiries table for sales and lease leads
CREATE TABLE IF NOT EXISTS property_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    inquirer_type TEXT CHECK (inquirer_type IN ('BUYER', 'TENANT', 'INVESTOR')),
    buyer_id UUID REFERENCES buyers(id),
    tenant_id UUID REFERENCES tenants(id),
    inquirer_name TEXT NOT NULL,
    inquirer_email TEXT NOT NULL,
    inquirer_phone TEXT,
    inquiry_type TEXT CHECK (inquiry_type IN ('VIEWING_REQUEST', 'PRICE_INQUIRY', 'AVAILABILITY_CHECK', 'NEGOTIATION', 'GENERAL_INFO')),
    message TEXT,
    preferred_viewing_date DATE,
    preferred_viewing_time TIME,
    budget_range TEXT,
    financing_ready BOOLEAN DEFAULT false,
    agent_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'SCHEDULED', 'VIEWED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'CLOSED')),
    response_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create land development tracking table
CREATE TABLE IF NOT EXISTS land_development (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    development_phase TEXT CHECK (development_phase IN ('PLANNING', 'SURVEYING', 'APPROVAL', 'INFRASTRUCTURE', 'CONSTRUCTION', 'COMPLETED')),
    phase_status TEXT DEFAULT 'NOT_STARTED' CHECK (phase_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    contractor_name TEXT,
    contractor_contact TEXT,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    permits_obtained BOOLEAN DEFAULT false,
    environmental_clearance BOOLEAN DEFAULT false,
    infrastructure_ready BOOLEAN DEFAULT false,
    utilities_connected BOOLEAN DEFAULT false,
    road_access_completed BOOLEAN DEFAULT false,
    drainage_completed BOOLEAN DEFAULT false,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Update existing rent_payments table to be more generic
ALTER TABLE rent_payments 
ADD COLUMN IF NOT EXISTS transaction_id UUID,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'RENT' CHECK (payment_type IN ('RENT', 'DEPOSIT', 'SALES_INSTALLMENT', 'DOWN_PAYMENT', 'COMMISSION', 'FEE'));

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_category ON properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_sale_price ON properties(sale_price);
CREATE INDEX IF NOT EXISTS idx_properties_lease_price ON properties(lease_price);
CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);
CREATE INDEX IF NOT EXISTS idx_buyers_assigned_agent_id ON buyers(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_property_id ON sales_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_buyer_id ON sales_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_status ON sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_payments_transaction_id ON sales_payments(sales_transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_payments_due_date ON sales_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON property_inquiries(status);

-- 9. Create RLS policies for buyers table
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own buyer profile" ON buyers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own buyer profile" ON buyers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view assigned buyers" ON buyers
    FOR SELECT USING (
        assigned_agent_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all buyers" ON buyers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN profiles p ON p.id = ur.user_id
            WHERE p.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- 10. Create RLS policies for sales_transactions table
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sales transactions" ON sales_transactions
    FOR SELECT USING (
        buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()) OR
        seller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        agent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view all sales transactions" ON sales_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN profiles p ON p.id = ur.user_id
            WHERE p.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- 11. Create RLS policies for sales_payments table
ALTER TABLE sales_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sales payments" ON sales_payments
    FOR SELECT USING (
        sales_transaction_id IN (
            SELECT id FROM sales_transactions st
            WHERE st.buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()) OR
                  st.seller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
                  st.agent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- 12. Create RLS policies for property_inquiries table
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inquiries for their properties" ON property_inquiries
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        ) OR
        buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()) OR
        agent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- 13. Create RLS policies for land_development table
ALTER TABLE land_development ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view development for their properties" ON land_development
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- 14. Create functions for automatic calculations
CREATE OR REPLACE FUNCTION calculate_sales_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate agent commission
    NEW.agent_commission_amount = NEW.sale_price * (NEW.agent_commission_rate / 100);
    
    -- Calculate platform fee
    NEW.platform_fee_amount = NEW.sale_price * (NEW.platform_fee_rate / 100);
    
    -- Calculate total transaction cost
    NEW.total_transaction_cost = NEW.sale_price + 
                                COALESCE(NEW.legal_fee, 0) + 
                                COALESCE(NEW.survey_fee, 0) + 
                                COALESCE(NEW.registration_fee, 0) +
                                NEW.platform_fee_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_sales_commission
    BEFORE INSERT OR UPDATE ON sales_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sales_commission();

-- 15. Create function to update property status based on transaction
CREATE OR REPLACE FUNCTION update_property_status_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' THEN
        UPDATE properties 
        SET status = 'Sold' 
        WHERE id = NEW.property_id;
    ELSIF NEW.status = 'CANCELLED' THEN
        UPDATE properties 
        SET status = 'Available' 
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_status_on_sale
    AFTER UPDATE ON sales_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_property_status_on_sale();

-- 16. Add comments for documentation
COMMENT ON TABLE buyers IS 'Stores buyer information for property sales transactions';
COMMENT ON TABLE sales_transactions IS 'Tracks property sales from initiation to completion';
COMMENT ON TABLE sales_payments IS 'Manages installment payments for property sales';
COMMENT ON TABLE property_inquiries IS 'Tracks leads and inquiries for both sales and leases';
COMMENT ON TABLE land_development IS 'Monitors land development progress and phases';

COMMENT ON COLUMN properties.transaction_type IS 'Whether property is for SALE or LEASE';
COMMENT ON COLUMN properties.property_category IS 'Category: RESIDENTIAL, COMMERCIAL, LAND, or INDUSTRIAL';
COMMENT ON COLUMN properties.sale_price IS 'Sale price for purchase transactions';
COMMENT ON COLUMN properties.lease_price IS 'Monthly/yearly lease price for rental transactions';
COMMENT ON COLUMN properties.development_status IS 'Development status for land properties';

-- Migration completed successfully
SELECT 'Sales & Lease Integration Migration Completed Successfully' as status;
