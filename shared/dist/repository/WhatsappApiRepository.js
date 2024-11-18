"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaId = void 0;
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const MediaId = async (media, fileName, To, mime_type) => {
    try {
        console.log("media", media, fileName, To, mime_type);
        const formData = new form_data_1.default();
        const fileStream = fs_1.default.createReadStream(media);
        formData.append("file", fileStream, {
            filename: fileName,
            contentType: mime_type,
        });
        formData.append("messaging_product", "whatsapp");
        const response = await axios_1.default.post(`${config_1.URL}/284177978114673/media`, formData, {
            headers: {
                Authorization: `Bearer ${config_2.whatsappAPIKey}`,
                ...formData.getHeaders(),
            }
        });
        if (response.status !== 200) {
            throw new Error("Failed to upload media");
        }
        const mediaId = response.data.id; // Assuming the ID is returned here
        console.log("mediaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", mediaId);
        return mediaId;
    }
    catch (error) {
        console.error("Error uploading media:", error.response?.data || error.message);
        throw { status: 500, message: 'Failed to upload media' };
    }
};
exports.MediaId = MediaId;
