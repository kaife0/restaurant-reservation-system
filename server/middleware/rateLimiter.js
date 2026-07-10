const rateLimit = require('express-rate-limit');

// Limits repeated auth attempts from one IP to slow down brute-force / credential-stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

module.exports = { authLimiter };
