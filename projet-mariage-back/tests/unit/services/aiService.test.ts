/**
 * Tests unitaires pour l'AI Service
 * Mock de l'API OpenAI et de la base de données
 */

import { chatWithAI } from '../../../src/services/aiService';
import connectDB from '../../../src/config/database';

// Mock du module OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Mock de la base de données
jest.mock('../../../src/config/database');

describe('AIService - Unit Tests', () => {
  let mockCreate: jest.Mock;
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Setup OpenAI mock
    const OpenAI = require('openai').default;
    const openaiInstance = new OpenAI();
    mockCreate = openaiInstance.chat.completions.create as jest.Mock;

    // Setup DB mock
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (connectDB as jest.Mock).mockResolvedValue(mockDb);

    // Set API key for tests
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chatWithAI', () => {
    it('should return AI response without tool calls', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Bonjour! Comment puis-je vous aider?',
              tool_calls: null,
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await chatWithAI('Bonjour');

      expect(result.reply).toBe('Bonjour! Comment puis-je vous aider?');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Bonjour' }),
          ]),
        })
      );
    });

    it('should handle tool calls for guest stats', async () => {
      const mockGuests = [
        { isAttending: true, guestCount: 2, dinnerParticipation: true },
        { isAttending: true, guestCount: 1, dinnerParticipation: false },
        { isAttending: false, guestCount: 0, dinnerParticipation: false },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockGuests),
      });

      // First call returns tool calls
      const firstResponse = {
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'get_guest_stats',
                    arguments: JSON.stringify({ filters: {} }),
                  },
                },
              ],
            },
          },
        ],
      };

      // Second call returns final answer
      const secondResponse = {
        choices: [
          {
            message: {
              content: 'Il y a 3 invités au total, dont 2 confirmés.',
            },
          },
        ],
      };

      mockCreate
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await chatWithAI('Combien d\'invités sont confirmés?');

      expect(result.reply).toBe('Il y a 3 invités au total, dont 2 confirmés.');
      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCollection.find).toHaveBeenCalled();
    });

    it('should handle list_guests tool call', async () => {
      const mockGuests = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', isAttending: true },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', isAttending: true },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockGuests),
      });

      const firstResponse = {
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_2',
                  type: 'function',
                  function: {
                    name: 'list_guests',
                    arguments: JSON.stringify({ filters: { isAttending: true }, limit: 10 }),
                  },
                },
              ],
            },
          },
        ],
      };

      const secondResponse = {
        choices: [
          {
            message: {
              content: 'Voici les invités confirmés : John Doe, Jane Smith.',
            },
          },
        ],
      };

      mockCreate
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await chatWithAI('Liste des invités confirmés');

      expect(result.reply).toContain('John Doe');
      expect(mockCollection.find).toHaveBeenCalled();
    });

    it('should handle get_guest_by_email tool call', async () => {
      const mockGuest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isAttending: true,
      };

      mockCollection.findOne.mockResolvedValue(mockGuest);

      const firstResponse = {
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_3',
                  type: 'function',
                  function: {
                    name: 'get_guest_by_email',
                    arguments: JSON.stringify({ email: 'john@example.com' }),
                  },
                },
              ],
            },
          },
        ],
      };

      const secondResponse = {
        choices: [
          {
            message: {
              content: 'John Doe a confirmé sa présence.',
            },
          },
        ],
      };

      mockCreate
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await chatWithAI('Info sur john@example.com');

      expect(result.reply).toContain('John Doe');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should handle tool call errors gracefully', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const firstResponse = {
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_4',
                  type: 'function',
                  function: {
                    name: 'get_guest_stats',
                    arguments: JSON.stringify({ filters: {} }),
                  },
                },
              ],
            },
          },
        ],
      };

      const secondResponse = {
        choices: [
          {
            message: {
              content: 'Désolé, une erreur est survenue.',
            },
          },
        ],
      };

      mockCreate
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await chatWithAI('Stats des invités');

      expect(result.reply).toBe('Désolé, une erreur est survenue.');
    });

    it('should return error message when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await chatWithAI('Test message');

      expect(result.reply).toContain('Clé OpenAI manquante');
      expect(mockCreate).not.toHaveBeenCalled();

      // Restore for other tests
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('should handle empty message content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '',
              tool_calls: null,
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await chatWithAI('Empty response test');

      expect(result.reply).toBe('');
    });
  });
});

