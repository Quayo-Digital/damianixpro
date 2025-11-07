-- Blockchain Integration System Migration
-- This migration creates tables and policies for blockchain wallet connections, smart contracts, and secure transactions

-- Create blockchain_wallets table for user wallet connections
CREATE TABLE IF NOT EXISTS blockchain_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('metamask', 'walletconnect', 'coinbase', 'trustwallet')),
    chain_id INTEGER NOT NULL,
    network VARCHAR(20) NOT NULL CHECK (network IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism')),
    balance DECIMAL(20,8) DEFAULT 0.00,
    is_primary BOOLEAN DEFAULT false,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address, network)
);

-- Create blockchain_transactions table for transaction history
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    gas_price DECIMAL(20,8),
    gas_limit DECIMAL(20,8),
    gas_used DECIMAL(20,8),
    nonce INTEGER,
    block_number BIGINT,
    block_hash VARCHAR(66),
    transaction_index INTEGER,
    network VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    transaction_type VARCHAR(30) DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'contract_call', 'property_registration', 'escrow_creation', 'escrow_funding', 'payment')),
    contract_address VARCHAR(42),
    input_data TEXT,
    logs JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_tokens table for tokenized properties
CREATE TABLE IF NOT EXISTS property_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    token_id VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    network VARCHAR(20) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    metadata_uri TEXT,
    metadata JSONB,
    price DECIMAL(20,8),
    currency VARCHAR(10) DEFAULT 'ETH',
    verified BOOLEAN DEFAULT false,
    verification_transaction_hash VARCHAR(66),
    minted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token_id, contract_address, network)
);

-- Create property_transfers table for property ownership transfers
CREATE TABLE IF NOT EXISTS property_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_token_id UUID NOT NULL REFERENCES property_tokens(id) ON DELETE CASCADE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    price DECIMAL(20,8),
    currency VARCHAR(10) DEFAULT 'ETH',
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT,
    escrow_used BOOLEAN DEFAULT false,
    escrow_address VARCHAR(42),
    transfer_type VARCHAR(20) DEFAULT 'sale' CHECK (transfer_type IN ('sale', 'gift', 'inheritance', 'auction')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create escrow_contracts table for property escrow transactions
CREATE TABLE IF NOT EXISTS escrow_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    property_token_id UUID REFERENCES property_tokens(id) ON DELETE CASCADE,
    contract_address VARCHAR(42) NOT NULL UNIQUE,
    network VARCHAR(20) NOT NULL,
    buyer_address VARCHAR(42) NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    escrow_agent_address VARCHAR(42),
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'funded', 'pending_release', 'released', 'refunded', 'disputed', 'cancelled')),
    conditions JSONB DEFAULT '[]',
    milestones JSONB DEFAULT '[]',
    creation_transaction_hash VARCHAR(66),
    funding_transaction_hash VARCHAR(66),
    release_transaction_hash VARCHAR(66),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    funded_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escrow_conditions table for escrow condition tracking
CREATE TABLE IF NOT EXISTS escrow_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escrow_contract_id UUID NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
    condition_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('inspection', 'financing', 'legal', 'custom')),
    required BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT false,
    completed_by VARCHAR(42),
    completed_at TIMESTAMP WITH TIME ZONE,
    evidence_hash VARCHAR(66),
    evidence_ipfs_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(escrow_contract_id, condition_id)
);

-- Create escrow_milestones table for escrow release milestones
CREATE TABLE IF NOT EXISTS escrow_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escrow_contract_id UUID NOT NULL REFERENCES escrow_contracts(id) ON DELETE CASCADE,
    milestone_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    required_conditions TEXT[] DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash VARCHAR(66),
    amount_released DECIMAL(20,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(escrow_contract_id, milestone_id)
);

-- Create blockchain_payments table for payment tracking
CREATE TABLE IF NOT EXISTS blockchain_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('rent', 'deposit', 'purchase', 'service_fee', 'maintenance', 'utilities')),
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    token_address VARCHAR(42),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    network VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    gas_used DECIMAL(20,8),
    gas_fee DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    description TEXT,
    metadata JSONB,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring_payments table for automated payments
CREATE TABLE IF NOT EXISTS recurring_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('rent', 'service_fee', 'utilities')),
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    network VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
    next_payment_date DATE NOT NULL,
    auto_execute BOOLEAN DEFAULT false,
    contract_address VARCHAR(42),
    active BOOLEAN DEFAULT true,
    total_payments INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_hashes table for blockchain document verification
CREATE TABLE IF NOT EXISTS document_hashes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('lease', 'deed', 'certificate', 'inspection', 'kyc', 'identity', 'contract')),
    file_hash VARCHAR(66) NOT NULL UNIQUE,
    ipfs_hash VARCHAR(100),
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB,
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(42),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_transaction_hash VARCHAR(66),
    signature VARCHAR(200),
    public_access BOOLEAN DEFAULT false,
    authorized_users TEXT[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create identity_credentials table for blockchain identity management
CREATE TABLE IF NOT EXISTS identity_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    did VARCHAR(200) UNIQUE,
    credential_type VARCHAR(30) NOT NULL CHECK (credential_type IN ('bvn', 'nin', 'cac', 'bank_account', 'address_proof', 'kyc_profile')),
    credential_hash VARCHAR(66) NOT NULL,
    encrypted_data TEXT,
    public_data JSONB,
    issuer VARCHAR(42) NOT NULL,
    signature VARCHAR(200) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    verification_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blockchain_events table for event logging
CREATE TABLE IF NOT EXISTS blockchain_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('transaction', 'escrow', 'property', 'payment', 'verification', 'contract')),
    event_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42),
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    network VARCHAR(20) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blockchain_wallets_user_id ON blockchain_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_wallets_address ON blockchain_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_wallets_network ON blockchain_wallets(network);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_network ON blockchain_transactions(network);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_created_at ON blockchain_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_tokens_property_id ON property_tokens(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tokens_token_id ON property_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_property_tokens_owner ON property_tokens(owner_address);
CREATE INDEX IF NOT EXISTS idx_property_tokens_network ON property_tokens(network);

CREATE INDEX IF NOT EXISTS idx_escrow_contracts_property_id ON escrow_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contracts_buyer ON escrow_contracts(buyer_address);
CREATE INDEX IF NOT EXISTS idx_escrow_contracts_seller ON escrow_contracts(seller_address);
CREATE INDEX IF NOT EXISTS idx_escrow_contracts_status ON escrow_contracts(status);

CREATE INDEX IF NOT EXISTS idx_blockchain_payments_user_id ON blockchain_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_payments_property_id ON blockchain_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_payments_type ON blockchain_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_payments_status ON blockchain_payments(status);

CREATE INDEX IF NOT EXISTS idx_document_hashes_user_id ON document_hashes(user_id);
CREATE INDEX IF NOT EXISTS idx_document_hashes_property_id ON document_hashes(property_id);
CREATE INDEX IF NOT EXISTS idx_document_hashes_file_hash ON document_hashes(file_hash);
CREATE INDEX IF NOT EXISTS idx_document_hashes_verified ON document_hashes(verified);

CREATE INDEX IF NOT EXISTS idx_identity_credentials_user_id ON identity_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_credentials_wallet ON identity_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_credentials_type ON identity_credentials(credential_type);

CREATE INDEX IF NOT EXISTS idx_blockchain_events_user_id ON blockchain_events(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_type ON blockchain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_processed ON blockchain_events(processed);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_created_at ON blockchain_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE blockchain_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blockchain_wallets
CREATE POLICY "Users can view their own wallets"
    ON blockchain_wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
    ON blockchain_wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
    ON blockchain_wallets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for blockchain_transactions
CREATE POLICY "Users can view their own transactions"
    ON blockchain_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON blockchain_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON blockchain_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for property_tokens
CREATE POLICY "Property owners can view their tokens"
    ON property_tokens FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can insert tokens for their properties"
    ON property_tokens FOR INSERT
    WITH CHECK (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Create RLS policies for escrow_contracts
CREATE POLICY "Escrow participants can view contracts"
    ON escrow_contracts FOR SELECT
    USING (
        buyer_address IN (
            SELECT wallet_address FROM blockchain_wallets 
            WHERE user_id = auth.uid()
        ) OR
        seller_address IN (
            SELECT wallet_address FROM blockchain_wallets 
            WHERE user_id = auth.uid()
        ) OR
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Create RLS policies for blockchain_payments
CREATE POLICY "Users can view their own payments"
    ON blockchain_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
    ON blockchain_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for document_hashes
CREATE POLICY "Users can view their own documents"
    ON document_hashes FOR SELECT
    USING (
        auth.uid() = user_id OR
        public_access = true OR
        auth.uid()::text = ANY(authorized_users)
    );

CREATE POLICY "Users can insert their own documents"
    ON document_hashes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for identity_credentials
CREATE POLICY "Users can view their own credentials"
    ON identity_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
    ON identity_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blockchain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_blockchain_wallets_updated_at
    BEFORE UPDATE ON blockchain_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_blockchain_transactions_updated_at
    BEFORE UPDATE ON blockchain_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_property_tokens_updated_at
    BEFORE UPDATE ON property_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_escrow_contracts_updated_at
    BEFORE UPDATE ON escrow_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_escrow_conditions_updated_at
    BEFORE UPDATE ON escrow_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_escrow_milestones_updated_at
    BEFORE UPDATE ON escrow_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_blockchain_payments_updated_at
    BEFORE UPDATE ON blockchain_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_recurring_payments_updated_at
    BEFORE UPDATE ON recurring_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_document_hashes_updated_at
    BEFORE UPDATE ON document_hashes
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

CREATE TRIGGER update_identity_credentials_updated_at
    BEFORE UPDATE ON identity_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_blockchain_updated_at();

-- Create function to calculate escrow completion percentage
CREATE OR REPLACE FUNCTION calculate_escrow_completion(escrow_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_conditions INTEGER;
    completed_conditions INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
    INTO total_conditions, completed_conditions
    FROM escrow_conditions
    WHERE escrow_contract_id = escrow_id AND required = true;
    
    IF total_conditions = 0 THEN
        RETURN 100;
    END IF;
    
    RETURN (completed_conditions * 100 / total_conditions);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's blockchain portfolio value
CREATE OR REPLACE FUNCTION get_blockchain_portfolio_value(user_wallet_address VARCHAR(42))
RETURNS TABLE (
    total_property_value DECIMAL(20,8),
    total_escrow_value DECIMAL(20,8),
    total_payments_sent DECIMAL(20,8),
    total_payments_received DECIMAL(20,8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(pt.price), 0) as total_property_value,
        COALESCE(SUM(ec.amount) FILTER (WHERE ec.buyer_address = user_wallet_address), 0) as total_escrow_value,
        COALESCE(SUM(bp.amount) FILTER (WHERE bp.from_address = user_wallet_address AND bp.status = 'confirmed'), 0) as total_payments_sent,
        COALESCE(SUM(bp.amount) FILTER (WHERE bp.to_address = user_wallet_address AND bp.status = 'confirmed'), 0) as total_payments_received
    FROM property_tokens pt
    FULL OUTER JOIN escrow_contracts ec ON pt.id = ec.property_token_id
    FULL OUTER JOIN blockchain_payments bp ON pt.property_id = bp.property_id
    WHERE pt.owner_address = user_wallet_address 
       OR ec.buyer_address = user_wallet_address 
       OR ec.seller_address = user_wallet_address
       OR bp.from_address = user_wallet_address 
       OR bp.to_address = user_wallet_address;
END;
$$ LANGUAGE plpgsql;

-- Create function to log blockchain events
CREATE OR REPLACE FUNCTION log_blockchain_event(
    p_user_id UUID,
    p_event_type VARCHAR(30),
    p_event_name VARCHAR(100),
    p_contract_address VARCHAR(42),
    p_transaction_hash VARCHAR(66),
    p_block_number BIGINT,
    p_network VARCHAR(20),
    p_event_data JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO blockchain_events (
        user_id,
        event_type,
        event_name,
        contract_address,
        transaction_hash,
        block_number,
        network,
        event_data
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_name,
        p_contract_address,
        p_transaction_hash,
        p_block_number,
        p_network,
        p_event_data
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON blockchain_wallets TO authenticated;
GRANT ALL ON blockchain_transactions TO authenticated;
GRANT ALL ON property_tokens TO authenticated;
GRANT ALL ON property_transfers TO authenticated;
GRANT ALL ON escrow_contracts TO authenticated;
GRANT ALL ON escrow_conditions TO authenticated;
GRANT ALL ON escrow_milestones TO authenticated;
GRANT ALL ON blockchain_payments TO authenticated;
GRANT ALL ON recurring_payments TO authenticated;
GRANT ALL ON document_hashes TO authenticated;
GRANT ALL ON identity_credentials TO authenticated;
GRANT ALL ON blockchain_events TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_escrow_completion TO authenticated;
GRANT EXECUTE ON FUNCTION get_blockchain_portfolio_value TO authenticated;
GRANT EXECUTE ON FUNCTION log_blockchain_event TO authenticated;

COMMENT ON TABLE blockchain_wallets IS 'User blockchain wallet connections and metadata';
COMMENT ON TABLE blockchain_transactions IS 'Blockchain transaction history and monitoring';
COMMENT ON TABLE property_tokens IS 'Tokenized properties on blockchain networks';
COMMENT ON TABLE property_transfers IS 'Property ownership transfer records';
COMMENT ON TABLE escrow_contracts IS 'Smart contract escrow transactions for properties';
COMMENT ON TABLE escrow_conditions IS 'Conditions that must be met for escrow release';
COMMENT ON TABLE escrow_milestones IS 'Milestone-based escrow release schedule';
COMMENT ON TABLE blockchain_payments IS 'Blockchain-based payment transactions';
COMMENT ON TABLE recurring_payments IS 'Automated recurring payment schedules';
COMMENT ON TABLE document_hashes IS 'Blockchain-verified document hashes and metadata';
COMMENT ON TABLE identity_credentials IS 'Blockchain-based identity credentials and verification';
COMMENT ON TABLE blockchain_events IS 'Blockchain event logging and monitoring';
COMMENT ON FUNCTION calculate_escrow_completion IS 'Calculate completion percentage of escrow conditions';
COMMENT ON FUNCTION get_blockchain_portfolio_value IS 'Get user blockchain portfolio value summary';
COMMENT ON FUNCTION log_blockchain_event IS 'Log blockchain events for monitoring and analytics';
