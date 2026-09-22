const Flutterwave = require('flutterwave-node-v3');

const flwPublicKey = process.env.FLW_PUBLIC_KEY;
const flwSecretKey = process.env.FLW_SECRET_KEY;

if (!flwPublicKey || !flwSecretKey) {
  console.warn('Warning: FLW_PUBLIC_KEY or FLW_SECRET_KEY is not defined in environment variables.');
}

const flw = new Flutterwave(flwPublicKey || '', flwSecretKey || '');

module.exports = { flw };
