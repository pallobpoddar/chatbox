import { MediaId } from "../repositories/WhatsappApiRepository";
import { ContentType } from "../services/whatsapp";
export const payloadInfo=async(Type:ContentType,To:string,messaging_product:string,media:string,context?:string,apiKey?:string,senderPhoneNumberId?:string)=>{
    try {
        const type=Type?.type;
    console.log('type:', type);
    console.log('To:', To);
    console.log('messaging_product:', messaging_product);
    const fileName:any=Type?.fileName
    const mime_type:any=Type?.mime_type
    let payload:any={
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: To,
        type: type
    };

    switch(type){
        case 'text':
            payload={
                ...payload,
                text: {
                    body: messaging_product
                }
            }
            break;

        case 'template':
            payload={
                ...payload,
                template: {
                    name: messaging_product,
                    language: {
                        code: 'en_US'
                    }
                }
            }
            break;
        case 'image':
            payload={
                ...payload,
                image: {
                    caption: messaging_product,
                    id: await MediaId(media,fileName,To,mime_type,apiKey,senderPhoneNumberId)
                }
            }
            break;
        case 'document':
            payload={
                ...payload,
                document: {
                    caption: messaging_product,
                    id: await MediaId(media,fileName,To,mime_type,apiKey,senderPhoneNumberId),
                    filename: fileName
                }
            }
            break;
        case 'audio':
            payload={
                ...payload,
                audio: {
                   
                    id: await MediaId(media,fileName,To,mime_type,apiKey,senderPhoneNumberId)
                }
            }
            break;
        case 'video':
            payload={
                ...payload,
                video: {
                    caption: messaging_product,
                    id: await MediaId(media,fileName,To,mime_type,apiKey,senderPhoneNumberId)
                }
            }
            break;
        default:
           console.log('Type not supported');
    }

    console.log('payload:', payload);

    if(context){
        payload={
            ...payload,
            context:{
                message_id:context
            }
        }
    }
    console.log('payload:', payload);

    return payload;
    } catch (error) {
        throw { status: 500, message: 'Failed to generate payload' };
    }
    
}