"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeInboxChunks = void 0;
const mergeInboxChunks = (documents, messageCount) => {
    let mergedDocument = {
        conversationId: documents[0].conversationId,
        chunkSerials: [],
        messages: [],
    };
    // Collect chunkSerials and reverse the messages
    documents.forEach((doc) => {
        // Add the chunk serial
        mergedDocument.chunkSerials.push(doc.chunkSerial);
        // Add the reversed messages to the messages array
        doc.messages.reverse().forEach((message) => {
            if (mergedDocument.messages.length < messageCount) {
                const msg = {
                    ...message,
                    chunkSerial: doc.chunkSerial,
                };
                mergedDocument.messages.push(msg);
            }
        });
    });
    return mergedDocument;
};
exports.mergeInboxChunks = mergeInboxChunks;
