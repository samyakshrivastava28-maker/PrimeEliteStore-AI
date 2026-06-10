// Find which AI Studio database has the products
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./gen-lang-client-0984598055-firebase-adminsdk-fbsvc-14d61d085e.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const databases = [
  'ai-studio-be84915a-1728-4687-917c-eec059e4efca',
  'ai-studio-2c4b8a34-fa64-4b18-a150-da55701e48b3',
  'ai-studio-933c4bf5-1d01-40a4-89b2-b96759bfb4ab',
  'ai-studio-07995112-8ea3-4052-9902-d6d06e37a0f8',
  'ai-studio-b64ddfbb-bba4-48c8-aa92-d2fdcde77e3d',
  'ai-studio-71b9a01d-ee68-4417-8649-179522871bea',
  'ai-studio-1e450079-e54d-4915-b830-2b64688d7416',
  'ai-studio-ff18f09a-21dd-43c9-ad91-8c69d26c137a',
];

async function findProducts() {
  for (const dbName of databases) {
    try {
      console.log(`\nChecking database: "${dbName}"...`);
      const db = getFirestore(app, dbName);
      const collections = await db.listCollections();
      
      if (collections.length > 0) {
        const colNames = collections.map(c => c.id);
        console.log(`  Collections: ${colNames.join(', ')}`);
        
        // Check if products collection exists
        if (colNames.includes('products')) {
          console.log(`\n✅ FOUND "products" collection in database "${dbName}"!`);
          const snapshot = await db.collection('products').limit(2).get();
          snapshot.forEach(doc => {
            console.log(`\n  Document ID: ${doc.id}`);
            const data = doc.data();
            for (const [key, value] of Object.entries(data)) {
              const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
              let preview;
              if (typeof value === 'string') {
                preview = value.substring(0, 100) + (value.length > 100 ? '...' : '');
              } else if (Array.isArray(value)) {
                preview = JSON.stringify(value.slice(0, 1), null, 2).substring(0, 250);
              } else if (value && typeof value === 'object') {
                preview = JSON.stringify(value, null, 2).substring(0, 150);
              } else {
                preview = String(value);
              }
              console.log(`    ${key} (${type}): ${preview}`);
            }
          });
          process.exit(0);
        }
      } else {
        console.log(`  No collections`);
      }
    } catch (err) {
      console.log(`  Error: ${err.message.substring(0, 100)}`);
    }
  }
  console.log('\n⚠️ Products not found in any database');
  process.exit(0);
}

findProducts();
