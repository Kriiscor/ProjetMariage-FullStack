import { Request, Response } from "express";
import { StripeService } from "../services/stripeService";
import type { CreateCheckoutSessionRequest } from "../types/payment";

/**
 * Crée une Checkout Session Stripe avec un montant dynamique
 *
 * Route: POST /api/payments/create-checkout-session
 *
 * Body:
 * - amount: number (requis) - Montant en euros
 * - currency?: string (optionnel) - Devise, par défaut 'eur'
 *
 * @param req - Requête Express
 * @param res - Réponse Express
 */
export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as CreateCheckoutSessionRequest;

    // Validation du montant
    if (!body.amount || typeof body.amount !== "number") {
      res.status(400).json({
        success: false,
        error: "Le montant (amount) est requis et doit être un nombre",
      });
      return;
    }

    if (body.amount <= 0) {
      res.status(400).json({
        success: false,
        error: "Le montant doit être supérieur à 0",
      });
      return;
    }

    // Validation de la devise si fournie
    if (body.currency && typeof body.currency !== "string") {
      res.status(400).json({
        success: false,
        error: "La devise (currency) doit être une chaîne de caractères",
      });
      return;
    }

    // Récupération de l'ID du produit depuis les variables d'environnement
    const productId = process.env.STRIPE_PRODUCT_ID;
    if (!productId) {
      console.error("STRIPE_PRODUCT_ID n'est pas défini dans le fichier .env");
      res.status(500).json({
        success: false,
        error: "Configuration Stripe incomplète",
      });
      return;
    }

    // Création de la session de checkout via le service
    const session = await StripeService.createCheckoutSession({
      amount: body.amount,
      currency: body.currency || "eur",
      productId: productId,
    });

    // Vérification que l'URL de la session est disponible
    if (!session.url) {
      res.status(500).json({
        success: false,
        error: "Impossible de créer l'URL de checkout",
      });
      return;
    }

    // Réponse de succès avec un message contenant l'URL de checkout
    res.status(201).json({
      success: true,
      message: session.url,
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de la Checkout Session:", error);

    // Gestion des erreurs spécifiques
    if (error.message.includes("montant")) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Erreur générique
    res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Erreur lors de la création de la session de paiement",
    });
  }
};

/**
 * Crée un Payment Intent Stripe (fonction existante, conservée pour compatibilité)
 *
 * @param req - Requête Express
 * @param res - Réponse Express
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    success: false,
    error: "Fonctionnalité non implémentée",
  });
};

export const getBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const balance = await StripeService.getBalance();

    const formattedBalance = {
      available: balance.available.map((amount) => ({
        amount: amount.amount / 100,
        currency: amount.currency.toUpperCase(),
        sourceTypes: amount.source_types,
      })),
      pending: balance.pending.map((amount) => ({
        amount: amount.amount / 100,
        currency: amount.currency.toUpperCase(),
        sourceTypes: amount.source_types,
      })),
      totalAvailable: balance.available.reduce(
        (sum, amount) => sum + amount.amount / 100,
        0
      ),
      totalPending: balance.pending.reduce(
        (sum, amount) => sum + amount.amount / 100,
        0
      ),
    };

    res.status(200).json({
      success: true,
      data: formattedBalance,
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération du solde:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de la récupération du solde",
    });
  }
};
