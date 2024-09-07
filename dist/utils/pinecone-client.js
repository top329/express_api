"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinecone = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
require("dotenv/config");
console.log(process.env.PINECONE_ENVIRONMENT);
console.log(process.env.PINECONE_API_KEY);
if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
    throw new Error('Pinecone environment or api key vars missing');
}
async function initPinecone() {
    try {
        console.log('Initializing Pinecone client...');
        const pinecone = new pinecone_1.Pinecone({
            // environment: process.env.PINECONE_ENVIRONMENT ?? '', //this is in the dashboard
            apiKey: process.env.PINECONE_API_KEY ?? '',
        });
        console.log('Pinecone client initialized successfully');
        return pinecone;
    }
    catch (error) {
        console.log('error', error);
        throw new Error('Failed to initialize Pinecone Client');
    }
}
exports.pinecone = initPinecone();
