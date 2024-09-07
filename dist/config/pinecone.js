"use strict";
/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PINECONE_NAME_SPACE = exports.PINECONE_INDEX_NAME = void 0;
if (!process.env.PINECONE_INDEX_NAME) {
    throw new Error('Missing Pinecone index name in .env file');
}
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? '';
exports.PINECONE_INDEX_NAME = PINECONE_INDEX_NAME;
const PINECONE_NAME_SPACE = 'aa4k'; //namespace is optional for your vectors
exports.PINECONE_NAME_SPACE = PINECONE_NAME_SPACE;
