# Guide des Tests - Backend Mariage

## 📚 Table des matières
- [Installation](#installation)
- [Structure des tests](#structure-des-tests)
- [Types de tests](#types-de-tests)
- [Exécution des tests](#exécution-des-tests)
- [Bonnes pratiques](#bonnes-pratiques)
- [Coverage](#coverage)
- [Troubleshooting](#troubleshooting)

## 🚀 Installation

Installez toutes les dépendances de test :

```bash
npm install
```

Les dépendances de test incluent :
- **Jest** : Framework de test
- **ts-jest** : Support TypeScript pour Jest
- **Supertest** : Tests d'API HTTP
- **mongodb-memory-server** : MongoDB en mémoire pour les tests

## 📁 Structure des tests

```
tests/
├── setup.ts                    # Configuration globale des tests
├── helpers/
│   └── db-handler.ts          # Helper pour gérer la DB en mémoire
├── unit/                      # Tests unitaires (fonctions isolées)
│   ├── controllers/
│   │   ├── guestController.test.ts
│   │   ├── authController.test.ts
│   │   └── paymentController.test.ts
│   └── services/
│       └── aiService.test.ts
└── integration/               # Tests d'intégration (routes complètes)
    ├── guestRoutes.test.ts
    ├── authRoutes.test.ts
    └── paymentRoutes.test.ts
```

## 🧪 Types de tests

### 1. Tests Unitaires (`tests/unit/`)

**Objectif** : Tester des fonctions isolées avec des mocks

**Caractéristiques** :
- ✅ Rapides (< 100ms par test)
- ✅ Pas de dépendances externes
- ✅ Mock de la base de données et des APIs
- ✅ Focus sur la logique métier

**Exemple** :
```typescript
it('should create a guest successfully', async () => {
  mockCollection.insertOne.mockResolvedValue({ insertedId });
  await createGuest(mockRequest, mockResponse);
  expect(mockResponse.status).toHaveBeenCalledWith(201);
});
```

### 2. Tests d'Intégration (`tests/integration/`)

**Objectif** : Tester le flux complet (routes → controllers → DB)

**Caractéristiques** :
- ✅ Utilise une vraie DB en mémoire
- ✅ Teste les endpoints HTTP complets
- ✅ Vérifie les interactions entre composants
- ⚠️ Plus lents (1-3s par test)

**Exemple** :
```typescript
it('should create a new guest via API', async () => {
  const response = await request(app)
    .post('/api/guests')
    .send(guestData)
    .expect(201);
  expect(response.body.success).toBe(true);
});
```

## ▶️ Exécution des tests

### Commandes disponibles

```bash
# Exécuter tous les tests avec coverage
npm test

# Mode watch (re-exécute automatiquement)
npm run test:watch

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests avec output détaillé
npm run test:verbose
```

### Exécuter un fichier spécifique

```bash
# Un seul fichier
npx jest tests/unit/controllers/guestController.test.ts

# Tous les tests guest
npx jest guest

# Avec watch mode
npx jest guest --watch
```

### Debug d'un test

```bash
# Avec logs détaillés
npx jest --verbose --no-coverage guestController
```

## ✅ Bonnes pratiques

### 1. Naming Convention

```typescript
// ✅ BON - Descriptif et clair
describe('GuestController - createGuest', () => {
  it('should return 201 when guest is created successfully', async () => {});
  it('should return 400 when email is missing', async () => {});
  it('should return 409 when email already exists', async () => {});
});

// ❌ MAUVAIS - Trop vague
describe('Guest', () => {
  it('works', async () => {});
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update guest successfully', async () => {
  // Arrange - Préparer les données
  const guestId = new ObjectId();
  const updateData = { isAttending: false };
  
  // Act - Exécuter l'action
  const response = await request(app)
    .put(`/api/guests/${guestId}`)
    .send(updateData);
  
  // Assert - Vérifier les résultats
  expect(response.status).toBe(200);
  expect(response.body.data.isAttending).toBe(false);
});
```

### 3. Test chaque cas (Happy Path + Error Cases)

```typescript
describe('createGuest', () => {
  it('should create guest with valid data', async () => {});
  it('should return 400 when email is invalid', async () => {});
  it('should return 400 when required fields are missing', async () => {});
  it('should return 500 when database fails', async () => {});
});
```

### 4. Isolation des tests

```typescript
// ✅ BON - Nettoyage après chaque test
afterEach(async () => {
  await dbHandler.clearDatabase();
  jest.clearAllMocks();
});

// ❌ MAUVAIS - Tests qui dépendent les uns des autres
```

### 5. Mock approprié

```typescript
// ✅ BON - Mock des dépendances externes
jest.mock('../../../src/config/stripe');

// ❌ MAUVAIS - Ne pas mocker et faire de vrais appels API pendant les tests
```

## 📊 Coverage

Le projet vise un coverage minimum de **70%** :

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### Voir le rapport de coverage

```bash
npm test
# Le rapport HTML est généré dans coverage/lcov-report/index.html
```

### Interpréter le coverage

- **Lines** : % de lignes exécutées
- **Branches** : % de conditions (if/else) testées
- **Functions** : % de fonctions appelées
- **Statements** : % d'instructions exécutées

## 🐛 Troubleshooting

### Problème : MongoDB Memory Server ne démarre pas

```bash
# Solution : Télécharger manuellement le binaire
npx mongodb-memory-server-postinstall
```

### Problème : Tests timeout

```javascript
// Augmenter le timeout dans jest.config.js
testTimeout: 30000, // 30 secondes
```

### Problème : Port déjà utilisé

```typescript
// Utiliser un port différent pour les tests
process.env.PORT = '5001'; // Dans setup.ts
```

### Problème : Mocks ne fonctionnent pas

```typescript
// S'assurer que jest.clearAllMocks() est appelé
afterEach(() => {
  jest.clearAllMocks();
});
```

### Problème : Variables d'environnement manquantes

```typescript
// Définir dans tests/setup.ts
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
```

## 📝 Checklist avant commit

- [ ] Tous les tests passent (`npm test`)
- [ ] Coverage > 70%
- [ ] Pas de tests skip/disabled (`it.skip`, `describe.skip`)
- [ ] Tests unitaires ET d'intégration ajoutés
- [ ] Pas de `console.log` dans les tests
- [ ] Documentation mise à jour si nécessaire

## 🎯 Objectifs de qualité

- ✅ **100%** des routes testées
- ✅ **80%+** de coverage pour les controllers
- ✅ **70%+** de coverage global
- ✅ Tests rapides (< 30s pour tous les tests)
- ✅ Tests fiables (pas de flakey tests)

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Besoin d'aide ?** Consultez les exemples dans `tests/unit/` et `tests/integration/`




