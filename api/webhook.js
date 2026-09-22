const { supabaseAdmin } = require('./_lib/supabase');
const { flw } = require('./_lib/flutterwave');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verify webhook signature using secret hash from environment
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    if (!secretHash || signature !== secretHash) {
      console.warn('Unauthorized webhook call received: invalid or missing verif-hash header.');
      return res.status(401).json({ error: 'Unauthorized: signature verification failed.' });
    }

    const payload = req.body;
    if (!payload || !payload.data) {
      return res.status(400).json({ error: 'Malformed webhook payload.' });
    }

    const transactionId = payload.data.id;
    const txRef = payload.data.tx_ref;
    const status = payload.data.status; // 'successful', 'failed', etc.

    if (!txRef) {
      console.warn('Webhook payload missing tx_ref:', payload);
      return res.status(200).send('Ignored: missing tx_ref');
    }

    // 2. Server-side double verification with Flutterwave API for absolute security
    // Ensures status was not spoofed and transaction actually cleared
    if (status === 'successful') {
      try {
        const verifyRes = await flw.Transaction.verify({ id: String(transactionId) });
        if (
          verifyRes &&
          verifyRes.status === 'success' &&
          verifyRes.data &&
          verifyRes.data.status === 'successful' &&
          verifyRes.data.tx_ref === txRef &&
          verifyRes.data.currency === 'UGX'
        ) {
          // 3. Update Supabase record payment_status to 'paid'
          const { error: updateError } = await supabaseAdmin
            .from('registrations')
            .update({ payment_status: 'paid' })
            .eq('transaction_reference', txRef);

          if (updateError) {
            console.error(`Database update failed for reference ${txRef}:`, updateError);
            return res.status(500).json({ error: 'Failed to update database status.' });
          }

          console.log(`Payment confirmed and marked 'paid' for reference: ${txRef}`);
        } else {
          console.warn(`Flutterwave verify check did not match expected values for tx ${transactionId}:`, verifyRes);
        }
      } catch (verifyErr) {
        console.error('Error during Flutterwave server-side transaction verification:', verifyErr);
      }
    } else if (status === 'failed') {
      // Optionally record failure
      await supabaseAdmin
        .from('registrations')
        .update({ payment_status: 'failed' })
        .eq('transaction_reference', txRef);
    }

    // 4. Always return 200 OK to acknowledge webhook receipt
    return res.status(200).json({ status: 'success', received: true });
  } catch (error) {
    console.error('Unhandled webhook error:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook.' });
  }
};
