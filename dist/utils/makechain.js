"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeChain = void 0;
const openai_1 = require("langchain/chat_models/openai");
const prompts_1 = require("langchain/prompts");
const runnable_1 = require("langchain/schema/runnable");
const output_parser_1 = require("langchain/schema/output_parser");
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
const combineDocumentsFn = (docs, separator = '\n\n') => {
    const serializedDocs = docs.map((doc) => doc.pageContent);
    return serializedDocs.join(separator);
};
const makeChain = (retriever) => {
    const condenseQuestionPrompt = prompts_1.ChatPromptTemplate.fromTemplate(CONDENSE_TEMPLATE);
    const answerPrompt = prompts_1.ChatPromptTemplate.fromTemplate(QA_TEMPLATE);
    const model = new openai_1.ChatOpenAI({
        temperature: 0,
        modelName: 'gpt-4o',
    });
    const standaloneQuestionChain = runnable_1.RunnableSequence.from([
        condenseQuestionPrompt,
        model,
        new output_parser_1.StringOutputParser(),
    ]);
    const retrievalChain = retriever.pipe(combineDocumentsFn);
    const answerChain = runnable_1.RunnableSequence.from([
        {
            context: runnable_1.RunnableSequence.from([
                (input) => input.question,
                retrievalChain,
            ]),
            chat_history: (input) => input.chat_history,
            question: (input) => input.question,
        },
        answerPrompt,
        model,
        new output_parser_1.StringOutputParser(),
    ]);
    const conversationalRetrievalQAChain = runnable_1.RunnableSequence.from([
        {
            question: standaloneQuestionChain,
            chat_history: (input) => input.chat_history,
        },
        answerChain,
    ]);
    return conversationalRetrievalQAChain;
};
exports.makeChain = makeChain;
