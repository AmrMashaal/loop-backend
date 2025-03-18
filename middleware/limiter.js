import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5,
  message: "Too many login/signup attempts. Please try again later.",
});

export const messageLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20,
  message: "Too many messages sent. Please wait.",
});

export const postLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: "Too many posts. Please wait.",
});

export const commentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: "Too many comments. Slow down!",
});

export const replyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  message: "Too many replies. Please slow down!",
});
