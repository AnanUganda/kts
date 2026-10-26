const { supabaseAdmin } = require('./_lib/supabase');

/**
 * Stores a website enquiry (booking, question, Welding Pack request, product order).
 * The site posts here; nothing is ever read back, so a discovered URL exposes no data.
 */

const FORMS = ['booking', 'question', 'pack', 'order', 'application', 'other'];
const LIMITS = { name: 120, phone: 40, email: 160, message: 2000, page: 200, value: 500 };

function clean(value, max) {
  if (value === undefined || value === null) return null;
  var text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = req.body || {};

    // Honeypot: real visitors never see this field, so anything in it is a bot.
    if (body.website) return res.status(200).json({ ok: true });

    const form = FORMS.indexOf(body.form) === -1 ? 'other' : body.form;

    // answers: { "Label as the visitor saw it": "their answer" }
    const answers = {};
    if (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)) {
      Object.keys(body.answers).slice(0, 25).forEach(function (key) {
        const label = clean(key, 80);
        const value = clean(body.answers[key], LIMITS.value);
        if (label && value) answers[label] = value;
      });
    }

    if (!Object.keys(answers).length) {
      return res.status(400).json({ error: 'Empty submission.' });
    }

    const row = {
      form: form,
      page: clean(body.page, LIMITS.page),
      name: clean(body.name, LIMITS.name),
      phone: clean(body.phone, LIMITS.phone),
      email: clean(body.email, LIMITS.email),
      message: clean(body.message, LIMITS.message),
      answers: answers,
    };

    const { error } = await supabaseAdmin.from('enquiries').insert(row);
    if (error) {
      console.error('Enquiry insert failed:', error.message);
      return res.status(500).json({ error: 'Could not save enquiry.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Enquiry handler error:', err);
    return res.status(500).json({ error: 'Could not save enquiry.' });
  }
};
