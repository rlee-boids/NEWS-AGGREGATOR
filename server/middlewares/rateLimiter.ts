/*import rateLimit from 'express-rate-limit';

// Rate limit configuration for news endpoints
export const newsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100  , // Limit each IP to 100 requests per `windowMs`
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  headers: true
});
*/
import { Request, Response, NextFunction } from 'express';

// tracking store
const newsRateLimiterStore: { [ip: string]: { count: number; startTime: number } } = {};

export const newsRateLimiter = (req: Request, res: Response, next: NextFunction): void | Response => {
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100; // Max requests allowed in the window
  const ip = req.ip || 'unknown';

  // Retrieve or initialize request tracking data for the IP
  const requests = newsRateLimiterStore[ip] || { count: 0, startTime: Date.now() };

  // Check if the time window has expired
  if (Date.now() - requests.startTime > RATE_LIMIT_WINDOW_MS) {
    // Reset count and time for the new window
    newsRateLimiterStore[ip] = { count: 1, startTime: Date.now() };
    return next(); // Allow the request to proceed
  }

  // Increment request count and check if it exceeds the limit
  requests.count++;
  newsRateLimiterStore[ip] = requests;

  if (requests.count > MAX_REQUESTS) {
    // If the limit is exceeded, respond with a 429 status
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  // If within the limit, proceed to the next middleware or route handler
  next();
};

