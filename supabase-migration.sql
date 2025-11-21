
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount_usd NUMERIC(10, 2) NOT NULL,
  amount_inr NUMERIC(10, 2),
  credits_purchased INTEGER NOT NULL,
  status TEXT CHECK (status IN ('created', 'pending', 'completed', 'failed', 'refunded')) DEFAULT 'created',
  payment_stage TEXT CHECK (payment_stage IN ('sandbox', 'production')) NOT NULL,
  payment_method TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failure', 'error')) DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_id ON credit_transactions(payment_id);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service can insert users" ON users;
CREATE POLICY "Service can insert users" ON users
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service can manage payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage payments" ON payments
  FOR ALL USING (true);
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service can create audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service can create transactions" ON credit_transactions;
CREATE POLICY "Service can create transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image, credits)
  VALUES (
      NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE OR REPLACE FUNCTION purchase_credits(
    p_user_id UUID,
  p_payment_id UUID,
  p_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF EXISTS (
      SELECT 1 FROM credit_transactions
    WHERE payment_id = p_payment_id
  ) THEN
    RETURN FALSE; 
  END IF;
  
  UPDATE users
  SET credits = credits + p_credits
  WHERE id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, amount, type, description, payment_id)
  VALUES (p_user_id, p_credits, 'purchase', 'Credit purchase', p_payment_id);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
