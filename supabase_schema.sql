-- 1. Create enum for payment statuses (or use text check constraint)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed');
    END IF;
END$$;

-- 2. Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    transaction_reference TEXT NOT NULL UNIQUE,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for high performance lookups
CREATE INDEX IF NOT EXISTS idx_registrations_tx_ref 
    ON public.registrations(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_registrations_status 
    ON public.registrations(payment_status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Note: The backend Vercel functions access Supabase using the SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS securely on the server side.
-- For direct anon client access (if needed), disallow direct INSERT/UPDATE from client:
DROP POLICY IF EXISTS "Deny direct public mutation" ON public.registrations;
CREATE POLICY "Deny direct public mutation" 
    ON public.registrations 
    FOR ALL 
    TO anon 
    USING (false);
