import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB, { closeConnection } from "./config/database";
import guestRoutes from "./routes/guestRoutes";

// Configuration des variables d'environnement
dotenv.config();

// Test initial de la connexion à la base de données
connectDB()
  .then(() => {
    console.log("Base de données initialisée");
  })
  .catch((error) => {
    console.error("Erreur d'initialisation de la base de données:", error);
    process.exit(1);
  });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/guests", guestRoutes);

// Route de test
app.get("/", (_req, res) => {
  res.json({ message: "API Mariage en ligne" });
});

// Gestion des erreurs 404
app.use((_req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

// Gestion de la fermeture propre
process.on("SIGTERM", () => {
  console.info("Signal SIGTERM reçu");
  shutdown();
});

process.on("SIGINT", () => {
  console.info("Signal SIGINT reçu");
  shutdown();
});

const shutdown = async () => {
  console.log("Fermeture du serveur...");
  server.close(async () => {
    console.log("Serveur Express fermé");
    await closeConnection();
    process.exit(0);
  });

  // Si la fermeture prend trop de temps, on force l'arrêt
  setTimeout(() => {
    console.error("Fermeture forcée après timeout");
    process.exit(1);
  }, 10000);
};
