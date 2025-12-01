/**
 * Configuration globale pour les tests
 * Exécuté avant tous les tests
 */

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mariage-test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';

// Désactiver les logs pendant les tests (optionnel)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};




