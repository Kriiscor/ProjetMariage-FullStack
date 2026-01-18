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
    console.error("Erreur lors de la création de l'invité:", error);

    // Gestion des erreurs MongoDB spécifiques
    if (error.code === 121) {
      return res.status(400).json({
        success: false,
        error:
          "Erreur de validation des données: " +
          (error.errInfo?.details || error.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Un invité avec cet email existe déjà",
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || "Erreur lors de la création de l'invité",
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
    console.error("Erreur lors de la récupération des invités:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la liste des invités",
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
      error: "Erreur lors de la récupération de l'invité",
    });
  }
};

// Mettre à jour un invité
export const updateGuest = async (req: Request, res: Response) => {
  try {
    const guestId = req.params.id;

    // Validation de l'ID
    if (!guestId || !ObjectId.isValid(guestId)) {
      return res.status(400).json({
        success: false,
        error: "ID invalide",
      });
    }

    const db = await connectDB();
    const guests = db.collection("guests");

    // Vérifier d'abord si l'invité existe
    const objectId = new ObjectId(guestId);
    const existingGuest = await guests.findOne({ _id: objectId });

    if (!existingGuest) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    // Exclure uniquement les champs non modifiables (_id, createdAt, updatedAt)
    const { _id, createdAt, updatedAt, ...updateData } = req.body;

    // Filtrer uniquement les valeurs undefined (null est valide pour certains champs)
    const cleanedUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // S'assurer que guestCount est un nombre si présent
    if (cleanedUpdateData.guestCount !== undefined) {
      const guestCountNum = Number(cleanedUpdateData.guestCount);
      if (
        Number.isNaN(guestCountNum) ||
        guestCountNum < 1 ||
        guestCountNum > 10
      ) {
        return res.status(400).json({
          success: false,
          error: "Le nombre d'invités doit être un nombre entre 1 et 10",
        });
      }
      cleanedUpdateData.guestCount = guestCountNum;
    }

    const updatedGuest = {
      ...cleanedUpdateData,
      updatedAt: new Date(),
    };

    // Utiliser updateOne pour avoir une meilleure gestion d'erreur
    const updateResult = await guests.updateOne(
      { _id: objectId },
      { $set: updatedGuest }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    if (updateResult.modifiedCount === 0) {
      // Vérifier si l'invité existe toujours
      const stillExists = await guests.findOne({ _id: objectId });
      if (!stillExists) {
        return res.status(404).json({
          success: false,
          error: "Invité non trouvé",
        });
      }

      // Si l'invité existe mais n'a pas été modifié, retourner l'invité actuel
      return res.status(200).json({
        success: true,
        data: stillExists,
      });
    }

    // Récupérer le document mis à jour
    const result = await guests.findOne({ _id: objectId });

    if (!result) {
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération de l'invité mis à jour",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'invité:", error);

    // Gestion des erreurs MongoDB spécifiques
    if (error.code === 121) {
      return res.status(400).json({
        success: false,
        error:
          "Erreur de validation des données: " +
          (error.errInfo?.details || error.message),
      });
    }

    if (error.code === 11000) {
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
    const guestId = req.params.id;

    // Validation de l'ID
    if (!guestId || !ObjectId.isValid(guestId)) {
      return res.status(400).json({
        success: false,
        error: "ID invalide",
      });
    }

    const db = await connectDB();
    const guests = db.collection("guests");

    const objectId = new ObjectId(guestId);

    // Utiliser deleteOne au lieu de findOneAndDelete pour une meilleure gestion
    const result = await guests.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: { message: "Invité supprimé avec succès" },
    });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'invité:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'invité",
    });
  }
};
