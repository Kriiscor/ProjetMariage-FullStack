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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Mettre à jour un invité
export const updateGuest = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const guests = db.collection("guests");

    const updatedGuest = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await guests.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedGuest },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: "Invité non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Supprimer un invité
export const deleteGuest = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const guests = db.collection("guests");

    const result = await guests.findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    if (!result.value) {
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
