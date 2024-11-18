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

export class ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  metadata?: { [key: string]: any };

  constructor(
    data?: T,
    message?: string,
    errors?: Array<{ field: string; message: string }>,
    pagination?: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    },
    metadata?: { [key: string]: any }
  ) {
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.pagination = pagination;
    this.metadata = metadata;
  }

  static success<T>(response: Response, data: T, message: string, pagination?: any, metadata?: any) {
    const responseData = new ApiResponse<T>(data, message ?? 'Request was successful', undefined, pagination, metadata)
    return response.status(200).json(responseData);
  }

  static error(response: Response, message: string, status: number = 500, errors?: Array<{ field: string; message: string }>, metadata?: any) {
    const responseData = new ApiResponse<any>(undefined, message ?? 'Internal Server Error', errors, undefined, metadata);
    return response.status(status).json(responseData);
  }
}


export function generateMetadata(version: string,service: string="shared") {
  return { version: version, service: service, time: new Date().toISOString() };
}