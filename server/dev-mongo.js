// Local-only helper: spins up an in-memory MongoDB instance for development
// when no MONGO_URI (e.g. Atlas) is configured. Not part of the deployed app.
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({ instance: { port: 27117, dbName: 'restaurant' } });
  console.log('MONGO_READY', mongod.getUri());
})();
