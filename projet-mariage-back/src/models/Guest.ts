import { ObjectId } from "mongodb";

export interface IGuest {
  _id?: ObjectId;
  lastName: string;
  firstName: string;
  email: string;
  isAttending: boolean | null;
  guestCount: number;
  dinnerParticipation: boolean | null;
  dinnerChoice: "raclette" | "pierreChaudde" | null;
  dessertChoice: "sorbet" | "tarteMyrille" | null;
  brunchParticipation: boolean | null;
  needsAccommodation: boolean | null;
  accommodationDates: string;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma de validation MongoDB
export const guestSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["lastName", "firstName", "email"],
      properties: {
        lastName: {
          bsonType: "string",
          description: "Le nom est requis",
        },
        firstName: {
          bsonType: "string",
          description: "Le prénom est requis",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "L'adresse email est requise et doit être valide",
        },
        isAttending: {
          bsonType: ["bool", "null"],
          description: "Indique si l'invité sera présent",
        },
        guestCount: {
          bsonType: "int",
          minimum: 1,
          maximum: 10,
          description: "Le nombre d'invités doit être entre 1 et 10",
        },
        dinnerParticipation: {
          bsonType: ["bool", "null"],
          description: "Indique si l'invité participe au dîner",
        },
        dinnerChoice: {
          enum: ["raclette", "pierreChaudde", null],
          description: "Le choix du plat principal",
        },
        dessertChoice: {
          enum: ["sorbet", "tarteMyrille", null],
          description: "Le choix du dessert",
        },
        brunchParticipation: {
          bsonType: ["bool", "null"],
          description: "Indique si l'invité participe au brunch",
        },
        needsAccommodation: {
          bsonType: ["bool", "null"],
          description: "Indique si l'invité a besoin d'hébergement",
        },
        accommodationDates: {
          bsonType: "string",
          description: "Les dates d'hébergement souhaitées",
        },
        comments: {
          bsonType: "string",
          description: "Commentaires additionnels",
        },
        createdAt: {
          bsonType: "date",
          description: "La date de création",
        },
        updatedAt: {
          bsonType: "date",
          description: "La date de mise à jour",
        },
      },
    },
  },
};
