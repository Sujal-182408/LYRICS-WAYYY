import express from "express";

import {
  getAnalytics,
  getListeningAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

/* =====================================================
   MAIN ANALYTICS
===================================================== */

router.get("/", getAnalytics);

/* =====================================================
   LISTENING ANALYTICS
===================================================== */

router.get("/listening", getListeningAnalytics);

export default router;