import { Response } from 'express';
export type PaginationData = {
    request: {
        skip: number;
        limit: number;
    };
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    } | undefined;
};
export declare class ApiResponse<T> {
    data?: T;
    message?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
    pagination?: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    metadata?: {
        [key: string]: any;
    };
    constructor(data?: T, message?: string, errors?: Array<{
        field: string;
        message: string;
    }>, pagination?: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    }, metadata?: {
        [key: string]: any;
    });
    static success<T>(response: Response, data: T, message: string, pagination?: any, metadata?: any): Response<any, Record<string, any>>;
    static error(response: Response, message: string, status?: number, errors?: Array<{
        field: string;
        message: string;
    }>, metadata?: any): Response<any, Record<string, any>>;
}
export declare function generateMetadata(version: string, service?: string): {
    version: string;
    service: string;
    time: string;
};
