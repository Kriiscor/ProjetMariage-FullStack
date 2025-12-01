/**
 * Tests d'intégration pour les routes guests
 * Utilise une vraie base de données en mémoire
 */

import request from 'supertest';
import express, { Express } from 'express';
import { ObjectId } from 'mongodb';
import guestRoutes from '../../src/routes/guestRoutes';
import * as dbHandler from '../helpers/db-handler';
import connectDB from '../../src/config/database';

// Mock de connectDB pour utiliser notre DB en mémoire
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Guest Routes - Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Initialiser la base de données en mémoire
    const db = await dbHandler.connect();
    (connectDB as jest.Mock).mockResolvedValue(db);

    // Configurer Express
    app = express();
    app.use(express.json());
    app.use('/api/guests', guestRoutes);
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  describe('POST /api/guests', () => {
    it('should create a new guest', async () => {
      const guestData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        isAttending: true,
        guestCount: 2,
        dinnerParticipation: true,
        dinnerChoice: 'raclette',
        dessertChoice: 'sorbet',
        brunchParticipation: false,
        needsAccommodation: false,
        accommodationDates: '',
        comments: 'Looking forward to it!',
      };

      const response = await request(app)
        .post('/api/guests')
        .send(guestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
      });
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should return 400 for invalid guest data', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/guests')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/guests', () => {
    it('should return all guests', async () => {
      const db = dbHandler.getDatabase();
      const guests = db.collection('guests');

      // Insérer des données de test
      await guests.insertMany([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isAttending: true,
          guestCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          isAttending: false,
          guestCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/guests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].firstName).toBeDefined();
    });

    it('should return empty array when no guests', async () => {
      const response = await request(app)
        .get('/api/guests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/guests/:id', () => {
    it('should return a guest by id', async () => {
      const db = dbHandler.getDatabase();
      const guests = db.collection('guests');

      const result = await guests.insertOne({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isAttending: true,
        guestCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/guests/${result.insertedId.toString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data._id).toBe(result.insertedId.toString());
    });

    it('should return 404 for non-existent guest', async () => {
      const fakeId = new ObjectId();

      const response = await request(app)
        .get(`/api/guests/${fakeId.toString()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invité non trouvé');
    });

    it('should return 500 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/guests/invalid-id')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/guests/:id', () => {
    it('should update a guest', async () => {
      const db = dbHandler.getDatabase();
      const guests = db.collection('guests');

      const result = await guests.insertOne({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isAttending: true,
        guestCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updateData = {
        isAttending: false,
        guestCount: 3,
      };

      const response = await request(app)
        .put(`/api/guests/${result.insertedId.toString()}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isAttending).toBe(false);
      expect(response.body.data.guestCount).toBe(3);
      expect(response.body.data.firstName).toBe('John'); // Should keep original data
    });

    it('should return 404 when updating non-existent guest', async () => {
      const fakeId = new ObjectId();

      const response = await request(app)
        .put(`/api/guests/${fakeId.toString()}`)
        .send({ isAttending: false })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invité non trouvé');
    });
  });

  describe('DELETE /api/guests/:id', () => {
    it('should delete a guest', async () => {
      const db = dbHandler.getDatabase();
      const guests = db.collection('guests');

      const result = await guests.insertOne({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isAttending: true,
        guestCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/guests/${result.insertedId.toString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({});

      // Vérifier que l'invité a bien été supprimé
      const deletedGuest = await guests.findOne({ _id: result.insertedId });
      expect(deletedGuest).toBeNull();
    });

    it('should return 404 when deleting non-existent guest', async () => {
      const fakeId = new ObjectId();

      const response = await request(app)
        .delete(`/api/guests/${fakeId.toString()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invité non trouvé');
    });
  });
});




