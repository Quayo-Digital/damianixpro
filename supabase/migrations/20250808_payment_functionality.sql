-- Enhanced Payment Functionality Migration
-- This migration creates the necessary tables and policies for comprehensive payment processing

-- Create tenant_payments table for the new payment system
CREATE TABLE IF NOT EXISTS tenant_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lease_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('rent', 'deposit', 'late_fee', 'utility', 'maintenance', 'other')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'card', 'mobile_money', 'ussd')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    gateway VARCHAR(50) CHECK (gateway IN ('paystack', 'flutterwave', 'bank_transfer', 'ussd')),
    gateway_response TEXT,
    access_code VARCHAR(100),
    fees DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_id ON tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_lease_id ON tenant_payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_status ON tenant_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_reference ON tenant_payments(reference_number);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_created_at ON tenant_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_due_date ON tenant_payments(due_date);

-- Create payment_methods table for supported payment options
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('gateway', 'bank_transfer', 'ussd', 'mobile_money')),
    provider VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, provider, is_active, configuration) VALUES
('Paystack', 'gateway', 'paystack', true, '{"supports_cards": true, "supports_bank_transfer": true, "supports_ussd": true}'),
('Flutterwave', 'gateway', 'flutterwave', true, '{"supports_cards": true, "supports_bank_transfer": true, "supports_ussd": true}'),
('Bank Transfer', 'bank_transfer', 'manual', true, '{"account_name": "Nigeria Homes Limited", "account_number": "0123456789", "bank_name": "First Bank of Nigeria", "sort_code": "011151003"}'),
('USSD Payment', 'ussd', 'manual', true, '{"supported_banks": ["GTBank", "Access Bank", "First Bank", "UBA", "Zenith Bank", "Fidelity Bank"]}')
ON CONFLICT DO NOTHING;

-- Create payment_notifications table for tracking payment-related notifications
CREATE TABLE IF NOT EXISTS payment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES tenant_payments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('payment_due', 'payment_overdue', 'payment_received', 'payment_failed', 'payment_reminder')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment notifications
CREATE INDEX IF NOT EXISTS idx_payment_notifications_tenant_id ON payment_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_payment_id ON payment_notifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_type ON payment_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_read ON payment_notifications(is_read);

-- Create payment_receipts table for storing receipt information
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES tenant_payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    receipt_url TEXT,
    receipt_data JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for payment receipts
CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_id ON payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_number ON payment_receipts(receipt_number);

-- Enable Row Level Security (RLS)
ALTER TABLE tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_payments
CREATE POLICY "Tenants can view their own payments" ON tenant_payments
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can create their own payments" ON tenant_payments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT id FROM tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can update their own pending payments" ON tenant_payments
    FOR UPDATE USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE user_id = auth.uid()
        ) AND payment_status = 'pending'
    );

CREATE POLICY "Admins and owners can view all payments" ON tenant_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Admins and owners can update all payments" ON tenant_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'owner')
        )
    );

-- RLS Policies for payment_methods
CREATE POLICY "Everyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- RLS Policies for payment_notifications
CREATE POLICY "Tenants can view their own payment notifications" ON payment_notifications
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can update their own payment notifications" ON payment_notifications
    FOR UPDATE USING (
        tenant_id IN (
            SELECT id FROM tenants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can create payment notifications" ON payment_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all payment notifications" ON payment_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- RLS Policies for payment_receipts
CREATE POLICY "Tenants can view their own payment receipts" ON payment_receipts
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM tenant_payments tp
            WHERE tp.tenant_id IN (
                SELECT id FROM tenants WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can create payment receipts" ON payment_receipts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all payment receipts" ON payment_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenant_payments_updated_at
    BEFORE UPDATE ON tenant_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate payment notifications
CREATE OR REPLACE FUNCTION create_payment_notification(
    p_payment_id UUID,
    p_tenant_id UUID,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(200),
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO payment_notifications (
        payment_id,
        tenant_id,
        notification_type,
        title,
        message
    ) VALUES (
        p_payment_id,
        p_tenant_id,
        p_notification_type,
        p_title,
        p_message
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate payment receipt
CREATE OR REPLACE FUNCTION generate_payment_receipt(
    p_payment_id UUID
)
RETURNS UUID AS $$
DECLARE
    receipt_id UUID;
    receipt_number VARCHAR(100);
    payment_record RECORD;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM tenant_payments WHERE id = p_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;
    
    -- Generate receipt number
    receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(p_payment_id::TEXT, 1, 8));
    
    -- Create receipt record
    INSERT INTO payment_receipts (
        payment_id,
        receipt_number,
        receipt_data
    ) VALUES (
        p_payment_id,
        receipt_number,
        jsonb_build_object(
            'payment_id', payment_record.id,
            'amount', payment_record.amount,
            'payment_type', payment_record.payment_type,
            'payment_method', payment_record.payment_method,
            'reference_number', payment_record.reference_number,
            'paid_at', payment_record.paid_at,
            'description', payment_record.description
        )
    ) RETURNING id INTO receipt_id;
    
    RETURN receipt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON tenant_payments TO authenticated;
GRANT ALL ON payment_methods TO authenticated;
GRANT ALL ON payment_notifications TO authenticated;
GRANT ALL ON payment_receipts TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_payment_notification TO authenticated;
GRANT EXECUTE ON FUNCTION generate_payment_receipt TO authenticated;

COMMENT ON TABLE tenant_payments IS 'Enhanced payment system for tenant payments with multiple gateway support';
COMMENT ON TABLE payment_methods IS 'Supported payment methods and their configurations';
COMMENT ON TABLE payment_notifications IS 'Payment-related notifications for tenants';
COMMENT ON TABLE payment_receipts IS 'Payment receipts and documentation';
