"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = require("langchain/embeddings/openai");
const pinecone_1 = require("langchain/vectorstores/pinecone");
const makechain_1 = require("./utils/makechain");
const pinecone_client_1 = require("./utils/pinecone-client");
const pinecone_2 = require("./config/pinecone");
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;
// middleware to parse JSON requests
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
app.post('/api/chat', async (req, res) => {
    const { question, history } = req.body;
    console.log('question', question);
    console.log('history', history);
    //only accept post requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    if (!question) {
        return res.status(400).json({ message: 'No question in the request' });
    }
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
    try {
        const index = (await pinecone_client_1.pinecone).Index(pinecone_2.PINECONE_INDEX_NAME);
        /* create vectorstore*/
        const vectorStore = await pinecone_1.PineconeStore.fromExistingIndex(new openai_1.OpenAIEmbeddings({}), {
            pineconeIndex: index,
            textKey: 'text',
            namespace: pinecone_2.PINECONE_NAME_SPACE, //namespace comes from your config folder
        });
        // Use a callback to get intermediate sources from the middle of the chain
        let resolveWithDocuments;
        const documentPromise = new Promise((resolve) => {
            resolveWithDocuments = resolve;
        });
        const retriever = vectorStore.asRetriever({
            callbacks: [
                {
                    handleRetrieverEnd(documents) {
                        resolveWithDocuments(documents);
                    },
                },
            ],
        });
        //create chain
        const chain = (0, makechain_1.makeChain)(retriever);
        const pastMessages = history
            .map((message) => {
            return [`Human: ${message[0]}`, `Assistant: ${message[1]}`].join('\n');
        })
            .join('\n');
        console.log(pastMessages);
        //Ask a question using chat history
        const response = await chain.invoke({
            question: sanitizedQuestion,
            chat_history: pastMessages,
        });
        const sourceDocuments = await documentPromise;
        console.log('response', response);
        res.status(200).json({ text: response, sourceDocuments });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
