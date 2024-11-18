import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import mime from "mime-types";
import fs from "fs";
import path from "path";
import { URL, senderPhoneNumberId, whatsappAPIKey } from "../../config/config";
import { payloadInfo } from "../../utils/Whatsapp";

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
  type: "text" | "document" | "audio" | "image" | "video" | "template";
  fileName?: string;
  mime_type?: string;
}

export class WhatsAppService {
  private senderPhoneNumberId: string;
  private whatsappAPIKey: string;
  private payload: MessagePayload|{};

  constructor(
    senderPhoneNumberId: string,
    whatsappAPIKey: string,
    payload: MessagePayload | {}
  ) {
    this.senderPhoneNumberId = senderPhoneNumberId;
    this.whatsappAPIKey = whatsappAPIKey;
    this.payload = payload;
  }

  setSender(senderPhoneNumberId: string, whatsappAPIKey: string) {
    this.whatsappAPIKey = whatsappAPIKey;
    this.senderPhoneNumberId = senderPhoneNumberId;
  }

  static async detectContentType(filePath: string): Promise<ContentType> {
    if (!filePath) {
      return { type: "text" }; // Handle empty file path
    }

    try {
      const buffer = fs.readFileSync(filePath);

      // Extract file extension from the file path
      const extname = path.extname(filePath).slice(1); // Remove leading dot
      const mimeType = mime.lookup(extname);

      if (mimeType) {
        const mimeToExt: { [key: string]: string } = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "audio/mpeg": ".mp3",
          "audio/wav": ".wav",
          "video/mp4": ".mp4",
          "application/pdf": ".pdf",
        };

        // Get the file extension based on the MIME type
        const extension = mimeToExt[mimeType] || "";

        // Set the filename with the correct extension
        const filename =
          path.basename(filePath, path.extname(filePath)) + extension;

        switch (mimeType) {
          case "image/jpeg":
          case "image/png":
          case "image/gif":
            return { type: "image", fileName: filename, mime_type: mimeType };
          case "audio/mpeg":
          case "audio/wav":
          case "audio/ogg":
            return { type: "audio", fileName: filename, mime_type: mimeType };
          case "video/mp4":
            return { type: "video", fileName: filename, mime_type: mimeType };
          case "application/pdf":
            return {
              type: "document",
              fileName: filename,
              mime_type: mimeType,
            };
          default:
            throw new Error("Unsupported file type");
        }
      } else {
        // Default case if MIME type is not found
        return { type: "text" };
      }
    } catch (error) {
      // Handle potential errors, such as file not found
      throw { status: 404, message: "File not found" };
    }
  }

  async createPayload(
    recipientPhoneNumber: string,
    messaging_content: string,
    media: string,
    ManualType?: string,
    context?: string
  ): Promise<MessagePayload> {
    try {
      if (messaging_content && messaging_content.length > 0) {
        messaging_content = messaging_content;
      } else {
        messaging_content = " ";
      }
      let Type: ContentType;
      if (ManualType === "template") {
        Type = { type: ManualType };
      } else {
        Type = await WhatsAppService.detectContentType(media ? media : "");
      }
      return await payloadInfo(
        Type,
        recipientPhoneNumber,
        messaging_content,
        media,
        context,
        this.whatsappAPIKey,
        this.senderPhoneNumberId
      );
    } catch (error) {
      throw { status: 500, message: "Failed to create payload" };
    }
  }

  async sendMessage(): Promise<AxiosResponse> {
    const url = `${URL}/${this.senderPhoneNumberId}/messages`;

    try {
      const response = await axios.post(url, this.payload, {
        headers: {
          Authorization: `Bearer ${this.whatsappAPIKey}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      throw { status: 500, message: "Failed to send message" };
    }
  }

  static decodeIncomingMessage(payload: any) {
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
        const type = messageData.type;
        let content = "";

        if (type === "text") {
          content = messageData.text.body;
        } else {
          content = messageData[type]?.caption || "";
        }

        const media =
          type !== "text"
            ? {
                type,
                sourceInfo: {
                  fileName: messageData[type]?.fileName || undefined,
                  caption: messageData[type].caption || undefined,
                  mime_type: messageData[type].mime_type,
                  id: messageData[type].id,
                },
              }
            : null;

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
            sent: Date.now(),
          },
          participantsNo: {
            sender: senderWhatsAppId,
            businessNumber: metadata
          },
        };
      }

      // Handle status processing wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W
      if (status) {
        const metadata = changes.metadata.display_phone_number;
        const timestamp = new Date(status.timestamp * 1000);
        const statusMap: { [key: string]: any } = {
          delivered: {
            source: {
              platform: "whatsapp",
              refId: status.id,
            },
            delivered: timestamp,
          },
          read: {
            source: {
              platform: "whatsapp",
              refId: status.id,
            },
            seen: timestamp,
          },
          sent: {
            source: {
              platform: "whatsapp",
              refId: status.id,
            },
            sent: timestamp,
          },
        };

        if (status.status in statusMap) {
          return { data:statusMap[status.status], participantsNo: {
            sender: status.recipient_id,
            businessNumber: metadata
          } };
        } else {
          return { whatsappMessageId: status.id };
        }
      }

      // If neither message nor status is found
      throw new Error("Neither message nor status found in payload");
    } catch (error: any) {
      throw {
        status: 500,
        message: "Failed to decode incoming message",
        error: error.message,
      };
    }
  }

  async downloadMediaUrl(mediaId: string): Promise<string> {
    try {
      const url = `${URL}/${mediaId}`;
      const getUrlResponse = await axios.get(url, {
        params: {
          phone_number_id: this.senderPhoneNumberId,
        },
        headers: {
          Authorization: `Bearer ${this.whatsappAPIKey}`,
        },
      });

      return getUrlResponse.data;
    } catch (error) {
      throw { status: 500, message: "Failed to download media url" };
    }
  }

  async downloadMedia(url: string, mediaId: string): Promise<string | null> {
    const headers = {
        Authorization: `Bearer ${this.whatsappAPIKey}`,
    };

    try {
        // Make GET request to download the media data
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: headers,
        });

        // Determine the file extension from the content type
        const contentType = response.headers['content-type'];
        const extension = mime.extension(contentType) || 'bin'; // Fallback to 'bin' if extension is unknown

        // Generate a file name with the appropriate extension
        const fileName = `${mediaId}.${extension}`;
        const filePath = path.join('public', 'downloads', fileName); // Set the directory to 'public/downloads/'

        // Ensure the directory exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        // Write the media buffer to a file
        fs.writeFileSync(filePath, response.data);

        console.log(`Media downloaded and saved to ${filePath}`);
        return filePath;
    } catch (error:any) {
        console.error('Error downloading the media:', error.message);
        return null;
    }
}
}



export default WhatsAppService;
