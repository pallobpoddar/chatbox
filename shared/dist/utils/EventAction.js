"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventAction = (action, sub, conversation, InboxChunks, retryCount, manualType) => {
    const payload = {
        action,
        sub,
        conversation,
        InboxChunks,
        retryCount,
        manualType,
    };
    return JSON.stringify(payload);
};
exports.default = EventAction;
