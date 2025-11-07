-- Missing Tables for Owner Dashboard Functionality
-- These tables are required for the owner dashboard to work properly

-- Property-Tenant relationship table
CREATE TABLE IF NOT EXISTS public.property_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(12,2) NOT NULL,
    security_deposit DECIMAL(12,2),
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, tenant_id)
);

-- Rent payments table (different from general payments)
CREATE TABLE IF NOT EXISTS public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_tenant_id UUID NOT NULL REFERENCES public.property_tenants(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    reference TEXT,
    status TEXT CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment breakdowns table
CREATE TABLE IF NOT EXISTS public.payment_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_payment_id UUID NOT NULL REFERENCES public.rent_payments(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.property_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_breakdowns ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_tenants
CREATE POLICY "Property owners can view their property tenants" ON public.property_tenants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
);
CREATE POLICY "Property owners can manage their property tenants" ON public.property_tenants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
);
CREATE POLICY "Tenants can view their own property relationships" ON public.property_tenants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND user_id = auth.uid())
);

-- RLS policies for rent_payments
CREATE POLICY "Property owners can view payments for their properties" ON public.rent_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.property_tenants pt 
        JOIN public.properties p ON pt.property_id = p.id 
        WHERE pt.id = property_tenant_id AND p.owner_id = auth.uid()
    )
);
CREATE POLICY "Tenants can view their own rent payments" ON public.rent_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.property_tenants pt 
        JOIN public.tenants t ON pt.tenant_id = t.id 
        WHERE pt.id = property_tenant_id AND t.user_id = auth.uid()
    )
);

-- RLS policies for payment_breakdowns
CREATE POLICY "Property owners can view payment breakdowns for their properties" ON public.payment_breakdowns FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rent_payments rp
        JOIN public.property_tenants pt ON rp.property_tenant_id = pt.id
        JOIN public.properties p ON pt.property_id = p.id
        WHERE rp.id = rent_payment_id AND p.owner_id = auth.uid()
    )
);
CREATE POLICY "Tenants can view their own payment breakdowns" ON public.payment_breakdowns FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rent_payments rp
        JOIN public.property_tenants pt ON rp.property_tenant_id = pt.id
        JOIN public.tenants t ON pt.tenant_id = t.id
        WHERE rp.id = rent_payment_id AND t.user_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_tenants_property ON public.property_tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tenants_tenant ON public.property_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_tenants_status ON public.property_tenants(status);
CREATE INDEX IF NOT EXISTS idx_property_tenants_dates ON public.property_tenants(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_rent_payments_property_tenant ON public.rent_payments(property_tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_date ON public.rent_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON public.rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_reference ON public.rent_payments(reference);

CREATE INDEX IF NOT EXISTS idx_payment_breakdowns_rent_payment ON public.payment_breakdowns(rent_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_breakdowns_category ON public.payment_breakdowns(category);

-- Add updated_at triggers
CREATE TRIGGER update_property_tenants_updated_at BEFORE UPDATE ON public.property_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON public.rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for new tables
ALTER TABLE public.property_tenants REPLICA IDENTITY FULL;
ALTER TABLE public.rent_payments REPLICA IDENTITY FULL;
ALTER TABLE public.payment_breakdowns REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_tenants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rent_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_breakdowns;
