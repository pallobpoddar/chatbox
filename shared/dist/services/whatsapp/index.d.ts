import { AxiosResponse } from 'axios';
interface MessagePayload {
    messaging_product: string;
    recipient_type: string;
    to?: string;
    type?: string;
    text?: {
        body: string;
    };
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: any[];
    };
}
export interface ContentType {
    type: 'text' | 'document' | 'audio' | 'image' | 'video' | 'template';
    fileName?: string;
    mime_type?: string;
}
export declare class WhatsAppService {
    private senderPhoneNumberId;
    private whatsappAPIKey;
    private payload;
    constructor(senderPhoneNumberId: string, whatsappAPIKey: string, payload: MessagePayload);
    setSender(senderPhoneNumberId: string, whatsappAPIKey: string): void;
    static detectContentType(filePath: string): Promise<ContentType>;
    static createPayload(recipientPhoneNumber: string, messaging_content: string, media: string, ManualType?: string, context?: string): Promise<MessagePayload>;
    sendMessage(): Promise<AxiosResponse>;
    static decodeIncomingMessage(payload: any): any;
}
export default WhatsAppService;
