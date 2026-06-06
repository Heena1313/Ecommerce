const paypal = require('paypal-rest-sdk');

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID || 'YOUR_SANDBOX_CLIENT_ID',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_SANDBOX_CLIENT_SECRET',
});

module.exports = paypal;
