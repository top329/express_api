import { Pinecone } from '@pinecone-database/pinecone';

import 'dotenv/config';

console.log(process.env.PINECONE_ENVIRONMENT);
console.log(process.env.PINECONE_API_KEY);

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone environment or api key vars missing');
}

async function initPinecone() {
  try {
    console.log('Initializing Pinecone client...');
    const pinecone = new Pinecone({
      // environment: process.env.PINECONE_ENVIRONMENT ?? '', //this is in the dashboard
      apiKey: process.env.PINECONE_API_KEY ?? '',
    });
    console.log('Pinecone client initialized successfully');
    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

export const pinecone = initPinecone();
