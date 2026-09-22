const { supabaseAdmin } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  try {
    const { ref } = req.query || {};

    if (!ref || typeof ref !== 'string' || !ref.trim()) {
      return res.status(400).json({ error: 'Transaction reference query parameter (?ref=...) is required.' });
    }

    const trimmedRef = ref.trim();

    // Query Supabase for the payment status
    const { data: registration, error: dbError } = await supabaseAdmin
      .from('registrations')
      .select('transaction_reference, payment_status, student_name, created_at')
      .eq('transaction_reference', trimmedRef)
      .maybeSingle();

    if (dbError) {
      console.error('Supabase query error in /api/status:', dbError);
      return res.status(500).json({ error: 'Database error fetching status.' });
    }

    if (!registration) {
      return res.status(404).json({ error: 'Registration reference not found.' });
    }

    // Set cache headers so polling always gets fresh status
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return res.status(200).json({
      transaction_reference: registration.transaction_reference,
      payment_status: registration.payment_status,
      student_name: registration.student_name,
    });
  } catch (error) {
    console.error('Unhandled error in /api/status:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
