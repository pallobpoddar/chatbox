"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payloadInfo = void 0;
const WhatsappApiRepository_1 = require("../repositories/WhatsappApiRepository");
const payloadInfo = async (Type, To, messaging_product, media, context) => {
    try {
        const type = Type?.type;
        console.log('type:', type);
        console.log('To:', To);
        console.log('messaging_product:', messaging_product);
        const fileName = Type?.fileName;
        const mime_type = Type?.mime_type;
        let payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: To,
            type: type
        };
        switch (type) {
            case 'text':
                payload = {
                    ...payload,
                    text: {
                        body: messaging_product
                    }
                };
                break;
            case 'template':
                payload = {
                    ...payload,
                    template: {
                        name: messaging_product,
                        language: {
                            code: 'en_US'
                        }
                    }
                };
                break;
            case 'image':
                payload = {
                    ...payload,
                    image: {
                        caption: messaging_product,
                        id: await (0, WhatsappApiRepository_1.MediaId)(media, fileName, To, mime_type)
                    }
                };
                break;
            case 'document':
                payload = {
                    ...payload,
                    document: {
                        caption: messaging_product,
                        id: await (0, WhatsappApiRepository_1.MediaId)(media, fileName, To, mime_type),
                        filename: fileName
                    }
                };
                break;
            case 'audio':
                payload = {
                    ...payload,
                    audio: {
                        id: await (0, WhatsappApiRepository_1.MediaId)(media, fileName, To, mime_type)
                    }
                };
                break;
            case 'video':
                payload = {
                    ...payload,
                    video: {
                        caption: messaging_product,
                        id: await (0, WhatsappApiRepository_1.MediaId)(media, fileName, To, mime_type)
                    }
                };
                break;
            default:
                console.log('Type not supported');
        }
        console.log('payload:', payload);
        if (context) {
            payload = {
                ...payload,
                context: {
                    message_id: context
                }
            };
        }
        console.log('payload:', payload);
        return payload;
    }
    catch (error) {
        throw { status: 500, message: 'Failed to generate payload' };
    }
};
exports.payloadInfo = payloadInfo;
