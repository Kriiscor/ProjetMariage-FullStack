import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import connectDB from "../config/database";

// Créer un nouvel invité
export const createGuest = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const guests = db.collection("guests");

    const newGuest = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await guests.insertOne(newGuest);

    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...newGuest },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Récupérer tous les invités
export const getAllGuests = async (_req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const guests = db.collection("guests");

    const allGuests = await guests.find().sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: allGuests.length,
      data: allGuests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Récupérer un invité par son ID
export const getGuestById = async (req: Request, res: Response) => {
  try {
    // Validation de l'ID
    if (!req.params.id || !ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "ID invalide",
      });
    }

    const db = await connectDB();
    const guests = db.collection("guests");

    const guest = await guests.findOne({ _id: new ObjectId(req.params.id) });

    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'invité:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Mettre à jour un invité
export const updateGuest = async (req: Request, res: Response) => {
  try {
    const guestId = req.params.id;

    // Validation de l'ID
    if (!guestId || !ObjectId.isValid(guestId)) {
      console.error("ID invalide reçu:", guestId);
      return res.status(400).json({
        success: false,
        error: "ID invalide",
      });
    }

    console.log("Tentative de mise à jour de l'invité avec l'ID:", guestId);

    const db = await connectDB();
    const guests = db.collection("guests");

    // Vérifier d'abord si l'invité existe
    const objectId = new ObjectId(guestId);
    const existingGuest = await guests.findOne({ _id: objectId });

    if (!existingGuest) {
      console.error("Invité non trouvé avec l'ID:", guestId);
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    console.log(
      "Invité trouvé, données actuelles:",
      JSON.stringify(existingGuest, null, 2)
    );
    console.log(
      "Données de mise à jour reçues:",
      JSON.stringify(req.body, null, 2)
    );

    // Exclure uniquement les champs non modifiables (_id, createdAt, updatedAt)
    const { _id, createdAt, updatedAt, ...updateData } = req.body;

    // Filtrer uniquement les valeurs undefined (null est valide pour certains champs)
    const cleanedUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // S'assurer que guestCount est un nombre si présent
    if (cleanedUpdateData.guestCount !== undefined) {
      const guestCountNum = Number(cleanedUpdateData.guestCount);
      if (Number.isNaN(guestCountNum)) {
        return res.status(400).json({
          success: false,
          error: "guestCount doit être un nombre valide",
        });
      }
      cleanedUpdateData.guestCount = guestCountNum;
    }

    const updatedGuest = {
      ...cleanedUpdateData,
      updatedAt: new Date(),
    };

    console.log(
      "Données à mettre à jour (après exclusion):",
      JSON.stringify(updatedGuest, null, 2)
    );

    // Utiliser updateOne pour avoir une meilleure gestion d'erreur
    const updateResult = await guests.updateOne(
      { _id: objectId },
      { $set: updatedGuest }
    );

    console.log(
      "Résultat de updateOne - matchedCount:",
      updateResult.matchedCount
    );
    console.log(
      "Résultat de updateOne - modifiedCount:",
      updateResult.modifiedCount
    );
    console.log(
      "Résultat de updateOne - acknowledged:",
      updateResult.acknowledged
    );

    if (updateResult.matchedCount === 0) {
      console.error(
        "Aucun document trouvé pour la mise à jour avec l'ID:",
        guestId
      );
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    if (updateResult.modifiedCount === 0) {
      console.warn("Aucune modification effectuée pour l'ID:", guestId);
      console.warn(
        "Cela peut indiquer que les données sont identiques ou qu'une erreur de validation s'est produite"
      );

      // Vérifier si l'invité existe toujours
      const stillExists = await guests.findOne({ _id: objectId });
      if (!stillExists) {
        return res.status(404).json({
          success: false,
          error: "Invité non trouvé après la mise à jour",
        });
      }

      // Si l'invité existe mais n'a pas été modifié, retourner l'invité actuel
      console.log("Aucune modification nécessaire, retour de l'invité actuel");
      return res.status(200).json({
        success: true,
        data: stillExists,
      });
    }

    // Récupérer le document mis à jour
    const result = await guests.findOne({ _id: objectId });

    if (!result) {
      console.error("Impossible de récupérer l'invité après la mise à jour");
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération de l'invité mis à jour",
      });
    }

    console.log("Mise à jour réussie pour l'invité:", guestId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'invité:", error);
    console.error("Stack trace:", error.stack);
    console.error("Code d'erreur:", error.code);
    console.error("Message d'erreur:", error.message);

    // Gestion des erreurs MongoDB spécifiques
    if (error.code === 121) {
      // Erreur de validation du schéma
      return res.status(400).json({
        success: false,
        error:
          "Erreur de validation: " + (error.errInfo?.details || error.message),
      });
    }

    if (error.code === 11000) {
      // Erreur de duplication (email unique)
      return res.status(400).json({
        success: false,
        error: "Un invité avec cet email existe déjà",
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || "Erreur lors de la mise à jour de l'invité",
    });
  }
};

// Supprimer un invité
export const deleteGuest = async (req: Request, res: Response) => {
  try {
    // Validation de l'ID
    if (!req.params.id || !ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "ID invalide",
      });
    }

    const db = await connectDB();
    const guests = db.collection("guests");

    const result = await guests.findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    if (!result?.value) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'invité:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
