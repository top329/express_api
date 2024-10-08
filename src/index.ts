import express from 'express';
import type { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

import { makeChain } from './utils/makechain';
import { pinecone } from './utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from './config/pinecone';

const app = express();
const port: Number = process.env.PORT ? Number(process.env.PORT) : 5000;

// middleware to parse JSON requests
app.use(express.json());

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
    const index = (await pinecone).Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
      }
    );

    // Use a callback to get intermediate sources from the middle of the chain
    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
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
    const chain = makeChain(retriever);

    const pastMessages = history
      .map((message: [string, string]) => {
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
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
