import fs from 'fs';
import FormData from 'form-data';
import { ReadStream } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { URL } from '../config/config';

export const MediaId = async (media: string, fileName: string, To: string, mime_type: string,whatsappAPIKey?: string, senderPhoneNumberId?: string) => {
  try {
    console.log("media", media, fileName, To, mime_type);
    
    const formData = new FormData();
    const fileStream: ReadStream = fs.createReadStream(media);
    
    formData.append("file", fileStream, {
      filename: fileName,
      contentType: mime_type,
    });

    formData.append("messaging_product", "whatsapp");

    const response = await axios.post(
      `${URL}/${senderPhoneNumberId}/media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${whatsappAPIKey}`,
          ...formData.getHeaders(),
        }
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to upload media");
    }
    console.log("response.data", response.data.id);

    const mediaId = response.data.id; // Assuming the ID is returned here
    
    return mediaId;
  } catch (error: any) {
    console.error("Error uploading media:", error.response?.data || error.message);
    throw {status: 500, message: 'Failed to upload media'}
  }
};