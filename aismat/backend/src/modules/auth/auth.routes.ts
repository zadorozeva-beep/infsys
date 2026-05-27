import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate } from '../../middleware/auth.middleware.js';
import * as authController from './auth.controller.js';

const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_MIN = 5;

const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Забагато спроб входу, спробуйте пізніше' },
  },
});

export const authRouter = Router();

authRouter.post('/register', (req, res, next) => {
  authController.register(req, res).catch(next);
});

authRouter.post('/login', loginLimiter, (req, res, next) => {
  authController.login(req, res).catch(next);
});

authRouter.get('/me', authenticate, (req, res, next) => {
  authController.me(req, res).catch(next);
});
