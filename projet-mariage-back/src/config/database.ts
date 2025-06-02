import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { guestSchema } from "../models/Guest";

dotenv.config();

const uri = process.env.MONGODB_URI as string;

// Création du client MongoDB avec les options recommandées
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const connectDB = async () => {
  try {
    // Connexion au serveur
    await client.connect();

    // Test de la connexion avec un ping
    await client.db("admin").command({ ping: 1 });
    console.log("Connexion à MongoDB Atlas établie avec succès !");

    const db = client.db("Projet-Mariage");

    // Création de la collection guests avec le schéma de validation
    try {
      await db.createCollection("guests", {
        validator: guestSchema.validator,
      });
      console.log("Collection 'guests' créée avec succès !");
    } catch (error: any) {
      // Si la collection existe déjà, on met à jour le schéma de validation
      if (error.code === 48) {
        await db.command({
          collMod: "guests",
          validator: guestSchema.validator,
        });
        console.log(
          "Schéma de validation de la collection 'guests' mis à jour !"
        );
      } else {
        throw error;
      }
    }

    // Création des index
    await db.collection("guests").createIndex({ email: 1 }, { unique: true });
    await db.collection("guests").createIndex({ createdAt: -1 });

    return db;
  } catch (error: any) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Fonction pour fermer la connexion
export const closeConnection = async () => {
  try {
    await client.close();
    console.log("Connexion MongoDB fermée");
  } catch (error: any) {
    console.error(
      `Erreur lors de la fermeture de la connexion: ${error.message}`
    );
  }
};

export default connectDB;
