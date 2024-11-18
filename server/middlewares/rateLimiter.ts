import rateLimit from 'express-rate-limit';

// Rate limit configuration for news endpoints
export const newsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100  , // Limit each IP to 100 requests per `windowMs`
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  headers: true
});
