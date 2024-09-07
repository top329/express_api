import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatPromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import type { Document } from 'langchain/document';
import type { VectorStoreRetriever } from 'langchain/vectorstores/base';

const CONDENSE_TEMPLATE = `こちらの会話とフォローアップの質問を元に、フォローアップの質問を独立した質問に言い換えてください。
<chat_history>
  {chat_history}
</chat_history>

フォローアップ入力： {question}
単体の質問です：`;

const QA_TEMPLATE = `あなたは専門家です。次の文脈の断片を元に、最後に出されている質問に答えてください。
もし答えがわからない場合は、「わかりません」と答えてください。無理に答えを作り出そうとしないでください。
質問が文脈やチャット履歴と関係のない場合は、関連する質問にのみ答えるように設計されています、と丁寧にお伝えください。

<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

質問: {question}
マークダウンで役立つ回答：`;

const combineDocumentsFn = (docs: Document[], separator = '\n\n') => {
  const serializedDocs = docs.map((doc) => doc.pageContent);
  return serializedDocs.join(separator);
};

export const makeChain = (retriever: VectorStoreRetriever) => {
  const condenseQuestionPrompt =
    ChatPromptTemplate.fromTemplate(CONDENSE_TEMPLATE);
  const answerPrompt = ChatPromptTemplate.fromTemplate(QA_TEMPLATE);

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-4o',
  });

  const standaloneQuestionChain = RunnableSequence.from([
    condenseQuestionPrompt,
    model,
    new StringOutputParser(),
  ]);

  const retrievalChain = retriever.pipe(combineDocumentsFn);

  const answerChain = RunnableSequence.from([
    {
      context: RunnableSequence.from([
        (input) => input.question,
        retrievalChain,
      ]),
      chat_history: (input) => input.chat_history,
      question: (input) => input.question,
    },
    answerPrompt,
    model,
    new StringOutputParser(),
  ]);

  const conversationalRetrievalQAChain = RunnableSequence.from([
    {
      question: standaloneQuestionChain,
      chat_history: (input) => input.chat_history,
    },
    answerChain,
  ]);

  return conversationalRetrievalQAChain;
};
