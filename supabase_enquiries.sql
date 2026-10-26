-- Kazo Technical School — website enquiries (booking, questions, Welding Pack, orders)
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Writes happen server-side in api/enquiry.js using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

-- 1. Enquiries table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    form TEXT NOT NULL CHECK (form IN ('booking', 'question', 'pack', 'order', 'application', 'other')),
    page TEXT,                       -- which page it came from
    name TEXT,
    phone TEXT,                      -- WhatsApp or phone number, as given
    email TEXT,
    message TEXT,                    -- the question, or the product ordered
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,   -- every field, labelled as the visitor saw it
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'replied', 'booked', 'attended', 'registered', 'not_interested')),
    notes TEXT                       -- for staff
);

-- 2. Indexes for the views staff actually use
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_form ON public.enquiries(form);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);

-- 3. Row Level Security: nothing public may read or write this table.
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct public access" ON public.enquiries;
CREATE POLICY "Deny direct public access"
    ON public.enquiries
    FOR ALL
    TO anon
    USING (false);

-- 4. Convenience view: newest first, with a ready-made WhatsApp reply link.
CREATE OR REPLACE VIEW public.enquiries_inbox AS
SELECT
    created_at AT TIME ZONE 'Africa/Kampala' AS received_kampala,
    form,
    name,
    phone,
    email,
    message,
    status,
    notes,
    CASE
        WHEN phone IS NULL OR phone = '' THEN NULL
        ELSE 'https://wa.me/' ||
             regexp_replace(
                 CASE
                     WHEN left(regexp_replace(phone, '\D', '', 'g'), 1) = '0'
                         THEN '256' || substr(regexp_replace(phone, '\D', '', 'g'), 2)
                     ELSE regexp_replace(phone, '\D', '', 'g')
                 END, '\D', '', 'g')
    END AS reply_on_whatsapp,
    id
FROM public.enquiries
ORDER BY created_at DESC;
