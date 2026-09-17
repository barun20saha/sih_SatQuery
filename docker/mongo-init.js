// MongoDB init script — runs once on first container start
// Creates the satquery_db database with initial collections and indexes

db = db.getSiblingDB('satquery_db');

// Create collections with schema validation
db.createCollection('query_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['query', 'query_type', 'created_at'],
      properties: {
        query:      { bsonType: 'string', description: 'Natural language query' },
        query_type: { bsonType: 'string', description: 'vqa|change|sar|describe|grounding' },
        task_id:    { bsonType: 'string' },
        status:     { bsonType: 'string' },
        duration_s: { bsonType: 'double' },
        created_at: { bsonType: 'date' },
      }
    }
  }
});

db.createCollection('spatial_annotations');

// Indexes for fast lookups
db.query_logs.createIndex({ created_at: -1 });
db.query_logs.createIndex({ task_id: 1 }, { unique: true, sparse: true });
db.query_logs.createIndex({ query_type: 1 });
db.spatial_annotations.createIndex({ task_id: 1 });

print('SatQuery MongoDB initialized: collections and indexes created.');
