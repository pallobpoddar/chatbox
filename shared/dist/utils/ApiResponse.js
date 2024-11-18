"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
exports.generateMetadata = generateMetadata;
class ApiResponse {
    data;
    message;
    errors;
    pagination;
    metadata;
    constructor(data, message, errors, pagination, metadata) {
        this.data = data;
        this.message = message;
        this.errors = errors;
        this.pagination = pagination;
        this.metadata = metadata;
    }
    static success(response, data, message, pagination, metadata) {
        const responseData = new ApiResponse(data, message ?? 'Request was successful', undefined, pagination, metadata);
        return response.status(200).json(responseData);
    }
    static error(response, message, status = 500, errors, metadata) {
        const responseData = new ApiResponse(undefined, message ?? 'Internal Server Error', errors, undefined, metadata);
        return response.status(status).json(responseData);
    }
}
exports.ApiResponse = ApiResponse;
function generateMetadata(version, service = "shared") {
    return { version: version, service: service, time: new Date().toISOString() };
}
