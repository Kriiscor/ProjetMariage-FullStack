/**
 * Tests unitaires pour l'AI Controller
 * Mock de l'aiService
 */

import { Request, Response } from 'express';
import { chat } from '../../../src/controllers/aiController';
import * as aiService from '../../../src/services/aiService';

// Mock du service AI
jest.mock('../../../src/services/aiService');

describe('AIController - Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockChatWithAI: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockChatWithAI = jest.spyOn(aiService, 'chatWithAI');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should return AI response successfully', async () => {
      const userMessage = 'Combien d\'invités sont confirmés?';
      const aiResponse = { reply: 'Il y a 25 invités confirmés.' };

      mockRequest.body = { message: userMessage };
      mockChatWithAI.mockResolvedValue(aiResponse);

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockChatWithAI).toHaveBeenCalledWith(userMessage);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: aiResponse,
      });
    });

    it('should return 400 when message is missing', async () => {
      mockRequest.body = {};

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockChatWithAI).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "'message' is required",
      });
    });

    it('should return 400 when message is not a string', async () => {
      mockRequest.body = { message: 123 };

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockChatWithAI).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "'message' is required",
      });
    });

    it('should return 400 when message is empty string', async () => {
      mockRequest.body = { message: '' };

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockChatWithAI).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "'message' is required",
      });
    });

    it('should return 500 when AI service fails', async () => {
      const errorMessage = 'OpenAI API error';
      mockRequest.body = { message: 'Test message' };
      mockChatWithAI.mockRejectedValue(new Error(errorMessage));

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
    });

    it('should handle undefined error message', async () => {
      mockRequest.body = { message: 'Test message' };
      mockChatWithAI.mockRejectedValue({});

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chat error',
      });
    });

    it('should handle complex AI responses', async () => {
      const complexResponse = {
        reply: 'Voici les statistiques : 25 invités confirmés, 18 pour le dîner.',
      };

      mockRequest.body = { message: 'Donne-moi les stats' };
      mockChatWithAI.mockResolvedValue(complexResponse);

      await chat(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: complexResponse,
      });
    });
  });
});




