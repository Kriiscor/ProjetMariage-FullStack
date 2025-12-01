/**
 * Helper pour gérer la base de données en mémoire pendant les tests
 * Utilise mongodb-memory-server pour créer une instance MongoDB temporaire
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';

let mongod: MongoMemoryServer | undefined;
let client: MongoClient | undefined;
let db: Db | undefined;

/**
 * Connect to the in-memory database
 */
export const connect = async (): Promise<Db> => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  client = new MongoClient(uri);
  await client.connect();
  
  db = client.db('mariage-test');
  
  return db;
};

/**
 * Drop database, close the connection and stop mongod
 */
export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
  
  if (mongod) {
    await mongod.stop();
  }
};

/**
 * Remove all the data for all db collections
 */
export const clearDatabase = async (): Promise<void> => {
  if (db) {
    const collections = await db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

/**
 * Get the database instance
 */
export const getDatabase = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connect() first.');
  }
  return db;
};




