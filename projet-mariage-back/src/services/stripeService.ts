import { stripe } from "../config/stripe";
import Stripe from "stripe";

export interface CreateCheckoutSessionData {
  amount: number;
  currency?: string;
  productId: string; 
}

export class StripeService {
  static async createCheckoutSession(
    data: CreateCheckoutSessionData
  ): Promise<Stripe.Checkout.Session> {
    try {
      if (data.amount <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }

      const amountInCents = Math.round(data.amount * 100);

      if (amountInCents < 50 && data.currency === "eur") {
        throw new Error("Le montant minimum est de 0.50€");
      }

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: data.currency || "eur",
              product: data.productId,
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment/cancel`,
        metadata: {
          created_at: new Date().toISOString(),
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      return session;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Erreur Stripe: ${error.message}`);
      }

      throw error;
    }
  }

  static async retrieveCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Erreur Stripe: ${error.message}`);
      }
      throw error;
    }
  }

  static async getBalance(): Promise<Stripe.Balance> {
    try {
      const balance = await stripe.balance.retrieve();
      return balance;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Erreur Stripe: ${error.message}`);
      }
      throw error;
    }
  }
}
