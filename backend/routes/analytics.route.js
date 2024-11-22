import express from 'express';
import {login, logout, refreshToken, signup} from "../controllers/auth.controller.js";
import {adminRoute, protectRoute} from "../middleware/auth.middleware.js";
import {getAnalytics} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get('/', protectRoute, adminRoute, getAnalytics)

export default router;