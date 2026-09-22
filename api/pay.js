const crypto = require('crypto');
const { supabaseAdmin } = require('./_lib/supabase');
const { flw } = require('./_lib/flutterwave');

/**
 * Helper to normalize Ugandan phone numbers to 256XXXXXXXXX format
 */
function normalizeUgandanPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '256' + cleaned.substring(1);
  } else if (cleaned.startsWith('256')) {
    // already starts with 256
  } else if (cleaned.length === 9) {
    cleaned = '256' + cleaned;
  }
  return cleaned;
}

/**
 * Helper to infer mobile network (MTN / AIRTEL) from Uganda phone prefix
 */
function inferNetwork(phone) {
  const norm = normalizeUgandanPhone(phone);
  // Uganda prefixes:
  // MTN: 25677, 25678, 25676, 25639
  // Airtel: 25670, 25675, 25674
  if (/^256(77|78|76|39)/.test(norm)) return 'MTN';
  if (/^256(70|75|74)/.test(norm)) return 'AIRTEL';
  return 'MTN'; // default fallback
}

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { student_name, phone_number, email, network } = req.body || {};

    // Validate inputs
    if (!student_name || typeof student_name !== 'string' || !student_name.trim()) {
      return res.status(400).json({ error: 'student_name is required' });
    }
    if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
      return res.status(400).json({ error: 'phone_number is required' });
    }

    const trimmedName = student_name.trim();
    const formattedPhone = normalizeUgandanPhone(phone_number.trim());

    if (formattedPhone.length < 12) {
      return res.status(400).json({ error: 'Invalid phone number format. Please provide a valid Ugandan phone number.' });
    }

    const chosenNetwork = network ? network.toUpperCase() : inferNetwork(formattedPhone);

    // 1. Generate unique transaction reference (e.g., KTS-REG-1711234567-a1b2c3d4)
    const randomHex = crypto.randomBytes(4).toString('hex');
    const transactionReference = `KTS-REG-${Date.now()}-${randomHex}`;

    // 2. Prevent data loss: insert pending registration into Supabase as 'unpaid' BEFORE initiating charge
    const { data: insertedRecord, error: dbError } = await supabaseAdmin
      .from('registrations')
      .insert([
        {
          student_name: trimmedName,
          phone_number: formattedPhone,
          transaction_reference: transactionReference,
          payment_status: 'unpaid',
        },
      ])
      .select('id, transaction_reference, payment_status')
      .single();

    if (dbError) {
      console.error('Supabase registration insert error:', dbError);
      return res.status(500).json({ error: 'Database error saving pending registration.' });
    }

    // 3. Call Flutterwave Uganda Mobile Money charge to trigger USSD push to the student's handset
    const registrationAmount = 35000; // Standard registration fee: UGX 35,000
    const customerEmail = email && email.includes('@') ? email : `${formattedPhone}@student.kts.ac.ug`;

    const flwPayload = {
      tx_ref: transactionReference,
      amount: registrationAmount,
      currency: 'UGX',
      email: customerEmail,
      phone_number: formattedPhone,
      fullname: trimmedName,
      network: chosenNetwork,
    };

    const flwResponse = await flw.MobileMoney.uganda(flwPayload);

    if (!flwResponse || flwResponse.status !== 'success') {
      console.error('Flutterwave initiation response error:', flwResponse);
      return res.status(502).json({
        error: flwResponse?.message || 'Failed to initiate Mobile Money prompt on your phone.',
        transaction_reference: transactionReference,
      });
    }

    // 4. Return transaction reference to frontend for polling
    return res.status(200).json({
      success: true,
      message: 'Mobile Money prompt dispatched to phone.',
      transaction_reference: transactionReference,
    });
  } catch (error) {
    console.error('Unhandled error in /api/pay:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};
