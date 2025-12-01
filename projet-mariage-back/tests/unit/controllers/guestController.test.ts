/**
 * Tests unitaires pour le GuestController
 * Mock de la base de données pour isoler les tests
 */

import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  createGuest,
  getAllGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
} from '../../../src/controllers/guestController';
import connectDB from '../../../src/config/database';

// Mock du module de base de données
jest.mock('../../../src/config/database');

describe('GuestController - Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock de la collection MongoDB
    mockCollection = {
      insertOne: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };

    // Mock de la base de données
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (connectDB as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuest', () => {
    it('should create a new guest successfully', async () => {
      const guestData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        isAttending: true,
        guestCount: 2,
      };

      const insertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({ insertedId });
      mockRequest.body = guestData;

      await createGuest(mockRequest as Request, mockResponse as Response);

      expect(mockDb.collection).toHaveBeenCalledWith('guests');
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...guestData,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: insertedId,
          ...guestData,
        }),
      });
    });

    it('should handle errors when creating a guest', async () => {
      const errorMessage = 'Database error';
      mockCollection.insertOne.mockRejectedValue(new Error(errorMessage));
      mockRequest.body = {};

      await createGuest(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
    });
  });

  describe('getAllGuests', () => {
    it('should return all guests', async () => {
      const mockGuests = [
        {
          _id: new ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        {
          _id: new ObjectId(),
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockGuests),
      });

      await getAllGuests(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: mockGuests.length,
        data: mockGuests,
      });
    });

    it('should handle errors when fetching guests', async () => {
      const errorMessage = 'Database error';
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockRejectedValue(new Error(errorMessage)),
      });

      await getAllGuests(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
    });
  });

  describe('getGuestById', () => {
    it('should return a guest by id', async () => {
      const guestId = new ObjectId();
      const mockGuest = {
        _id: guestId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      mockRequest.params = { id: guestId.toString() };
      mockCollection.findOne.mockResolvedValue(mockGuest);

      await getGuestById(mockRequest as Request, mockResponse as Response);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: guestId });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockGuest,
      });
    });

    it('should return 404 when guest not found', async () => {
      mockRequest.params = { id: new ObjectId().toString() };
      mockCollection.findOne.mockResolvedValue(null);

      await getGuestById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invité non trouvé',
      });
    });
  });

  describe('updateGuest', () => {
    it('should update a guest successfully', async () => {
      const guestId = new ObjectId();
      const updateData = {
        firstName: 'John Updated',
        isAttending: false,
      };
      const updatedGuest = {
        _id: guestId,
        ...updateData,
        updatedAt: expect.any(Date),
      };

      mockRequest.params = { id: guestId.toString() };
      mockRequest.body = updateData;
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedGuest });

      await updateGuest(mockRequest as Request, mockResponse as Response);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: guestId },
        { $set: expect.objectContaining({ ...updateData, updatedAt: expect.any(Date) }) },
        { returnDocument: 'after' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedGuest,
      });
    });

    it('should return 404 when updating non-existent guest', async () => {
      mockRequest.params = { id: new ObjectId().toString() };
      mockRequest.body = { firstName: 'Updated' };
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });

      await updateGuest(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invité non trouvé',
      });
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest successfully', async () => {
      const guestId = new ObjectId();
      const deletedGuest = { _id: guestId, firstName: 'John', lastName: 'Doe' };

      mockRequest.params = { id: guestId.toString() };
      mockCollection.findOneAndDelete.mockResolvedValue({ value: deletedGuest });

      await deleteGuest(mockRequest as Request, mockResponse as Response);

      expect(mockCollection.findOneAndDelete).toHaveBeenCalledWith({ _id: guestId });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {},
      });
    });

    it('should return 404 when deleting non-existent guest', async () => {
      mockRequest.params = { id: new ObjectId().toString() };
      mockCollection.findOneAndDelete.mockResolvedValue({ value: null });

      await deleteGuest(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invité non trouvé',
      });
    });
  });
});




