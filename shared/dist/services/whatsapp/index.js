"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const mime_types_1 = __importDefault(require("mime-types"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../../config/config");
const Whatsapp_1 = require("../../utils/Whatsapp");
class WhatsAppService {
    senderPhoneNumberId;
    whatsappAPIKey;
    payload;
    constructor(senderPhoneNumberId, whatsappAPIKey, payload) {
        this.senderPhoneNumberId = senderPhoneNumberId;
        this.whatsappAPIKey = whatsappAPIKey;
        this.payload = payload;
    }
    setSender(senderPhoneNumberId, whatsappAPIKey) {
        this.whatsappAPIKey = whatsappAPIKey;
        this.senderPhoneNumberId = senderPhoneNumberId;
    }
    static async detectContentType(filePath) {
        if (!filePath) {
            return { type: 'text' }; // Handle empty file path
        }
        try {
            const buffer = fs_1.default.readFileSync(filePath);
            // Extract file extension from the file path
            const extname = path_1.default.extname(filePath).slice(1); // Remove leading dot
            const mimeType = mime_types_1.default.lookup(extname);
            if (mimeType) {
                const mimeToExt = {
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif',
                    'audio/mpeg': '.mp3',
                    'audio/wav': '.wav',
                    'video/mp4': '.mp4',
                    'application/pdf': '.pdf',
                };
                // Get the file extension based on the MIME type
                const extension = mimeToExt[mimeType] || '';
                // Set the filename with the correct extension
                const filename = path_1.default.basename(filePath, path_1.default.extname(filePath)) + extension;
                switch (mimeType) {
                    case 'image/jpeg':
                    case 'image/png':
                    case 'image/gif':
                        return { type: 'image', fileName: filename, mime_type: mimeType };
                    case 'audio/mpeg':
                    case 'audio/wav':
                    case 'audio/ogg':
                        return { type: 'audio', fileName: filename, mime_type: mimeType };
                    case 'video/mp4':
                        return { type: 'video', fileName: filename, mime_type: mimeType };
                    case 'application/pdf':
                        return { type: 'document', fileName: filename, mime_type: mimeType };
                    default:
                        throw new Error('Unsupported file type');
                }
            }
            else {
                // Default case if MIME type is not found
                return { type: 'text' };
            }
        }
        catch (error) {
            // Handle potential errors, such as file not found
            throw { status: 404, message: 'File not found' };
        }
    }
    static async createPayload(recipientPhoneNumber, messaging_content, media, ManualType, context) {
        try {
            if (messaging_content && messaging_content.length > 0) {
                messaging_content = messaging_content;
            }
            else {
                messaging_content = " ";
            }
            let Type;
            if (ManualType === "template") {
                Type = { type: ManualType };
            }
            else {
                Type = await WhatsAppService.detectContentType(media ? media : "");
            }
            return await (0, Whatsapp_1.payloadInfo)(Type, recipientPhoneNumber, messaging_content, media, context);
        }
        catch (error) {
            throw { status: 500, message: 'Failed to create payload' };
        }
    }
    async sendMessage() {
        const url = `${config_1.URL}/${this.senderPhoneNumberId}/messages`;
        try {
            const response = await axios_1.default.post(url, this.payload, {
                headers: {
                    Authorization: `Bearer ${this.whatsappAPIKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response;
        }
        catch (error) {
            throw { status: 500, message: 'Failed to send message' };
        }
    }
    static decodeIncomingMessage(payload) {
        try {
            const entry = payload.entry[0];
            const changes = entry.changes[0].value;
            // Check if we have a status or a message
            const status = changes.statuses ? changes.statuses[0] : null;
            const messageData = changes.messages ? changes.messages[0] : null;
            // Handle message processing
            if (messageData && !status) {
                const contactData = changes.contacts[0];
                const senderWhatsAppId = contactData.wa_id;
                const metadata = changes.metadata.display_phone_number;
                console.log("metadata", metadata);
                const type = messageData.type;
                let content = '';
                if (type === 'text') {
                    content = messageData.text.body;
                }
                else {
                    content = messageData[type]?.caption || '';
                }
                const media = type !== 'text' ? {
                    type,
                    sourceInfo: {
                        mime_type: messageData[type].mime_type,
                        id: messageData[type].id,
                    },
                } : {
                    type: 'text',
                    sourceInfo: null,
                };
                return {
                    data: {
                        sender: senderWhatsAppId,
                        type,
                        content,
                        media,
                        context: messageData.context?.id || null,
                        source: {
                            platform: "whatsapp",
                            refId: messageData.id,
                        },
                        pass: {
                            platform: null,
                            refId: null,
                        },
                        delivered: null,
                        seen: null,
                        sent: null,
                    },
                    businessNumber: metadata
                };
            }
            // Handle status processing wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W
            if (status) {
                const timestamp = new Date(status.timestamp * 1000);
                const statusMap = {
                    delivered: {
                        source: {
                            platform: "whatsapp",
                            refId: status.id,
                        },
                        delivered: timestamp
                    },
                    read: {
                        source: {
                            platform: "whatsapp",
                            refId: status.id,
                        },
                        seen: timestamp
                    },
                    sent: {
                        source: {
                            platform: "whatsapp",
                            refId: status.id,
                        },
                        sent: timestamp
                    },
                };
                if (status.status in statusMap) {
                    return statusMap[status.status];
                }
                else {
                    return { whatsappMessageId: status.id };
                }
            }
            // If neither message nor status is found
            throw new Error('Neither message nor status found in payload');
        }
        catch (error) {
            throw { status: 500, message: 'Failed to decode incoming message', error: error.message };
        }
    }
}
exports.WhatsAppService = WhatsAppService;
// testing code *****************************************************************************
const recipientPhoneNumber = '+8801739864401'; // Replace with actual recipient phone number
const messageContent = 'abc';
const incomingPayload = {
    "object": "whatsapp_business_account",
    "entry": [
        {
            "id": "8856996819413533",
            "changes": [
                {
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "16505553333",
                            "phone_number_id": "<PHONE_NUMBER_ID>"
                        },
                        "contacts": [
                            {
                                "profile": {
                                    "name": "<CONTACT_NAME>"
                                },
                                "wa_id": "<WA_ID>"
                            }
                        ],
                        "messages": [
                            {
                                "from": "<FROM_PHONE_NUMBER>",
                                "id": "wamid.id",
                                "timestamp": "<TIMESTAMP>",
                                "type": "image",
                                "image": {
                                    "caption": "This is a caption",
                                    "mime_type": "image/jpeg",
                                    "sha256": "81d3bd8a8db4868c9520ed47186e8b7c5789e61ff79f7f834be6950b808a90d3",
                                    "id": "2754859441498128"
                                }
                            }
                        ]
                    },
                    "field": "messages"
                }
            ]
        }
    ]
};
const statusPayload = {
    "object": "whatsapp_business_account",
    "entry": [
        {
            "id": "8856996819413533",
            "changes": [
                {
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "16505553333",
                            "phone_number_id": "27681414235104944"
                        },
                        "statuses": [
                            {
                                "id": "wamid.gBGGFlCGg0cvAglAxydbAoy-gwNo",
                                "status": "read",
                                "timestamp": "1603086313",
                                "recipient_id": "16315551234"
                            }
                        ]
                    },
                    "field": "messages"
                }
            ]
        }
    ]
};
// Initialize the WhatsApp service
// const sendWhatsAppMessage =async() => {
//   try {
//     // Create the payload
//     const payload = await WhatsAppService.createPayload(recipientPhoneNumber, messageContent, '',"",'123456');
//     // const whatsappService = new WhatsAppService(senderPhoneNumberId, whatsappAPIKey,payload);
//     console.log('Payload:', payload);
// // Send the message
// const response = await whatsappService.sendMessage();
// console.log('Message sent successfully:', response.data);
// // Decode the message
// const decodedMessage = WhatsAppService.decodeIncomingMessage(incomingPayload);
// console.log('Decoded Message:', decodedMessage);
//   } catch (error) {
//     throw { status: 500, message: 'Failed to send message', error };
//   }
// };
// Run the function to send a WhatsApp message
// sendWhatsAppMessage();
exports.default = WhatsAppService;
