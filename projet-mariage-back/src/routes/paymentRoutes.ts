import { Router } from "express";
import {
  createPaymentIntent,
  createCheckoutSession,
  getBalance,
} from "../controllers/paymentController";

const router = Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/balance", getBalance);

export default router;
