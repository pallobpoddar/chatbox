import { PaginationData } from "@one.chat/shared/dist/utils/ApiResponse";

export const FilterParamsDecoder = (filters: string) => {
    try {
        if (!filters || filters.length === 0) return {};
        const decoded = JSON.parse(filters.replace(/'/g, '"'));
        let filterQuery: any = {};

        decoded.forEach((filter: any) => {
            const operator = filter[1], field = filter[0], value = filter[2];

            switch (operator) {
                case 'eq':
                    filterQuery[field] = value;
                    break;
                case 'gt':
                    filterQuery[field] = { $gt: value };
                    break;
                case 'lt':
                    filterQuery[field] = { $lt: value };
                    break;
                case 'gte':
                    filterQuery[field] = { $gte: value };
                    break;
                case 'lte':
                    filterQuery[field] = { $lte: value };
                    break;
                default:
                    break;
            }
        });

        return filterQuery
    } catch (error) {
        console.log(error)
        throw { status: 400, message: "Bad Filter Format" }

    }

}

export const SortParamsDecoder = (sort: string) => {
    try {
        if (!sort || sort.length === 0) return [];
        const decoded = JSON.parse(sort.replace(/'/g, '"'));

        // Convert JSON array to Mongoose sort format
        const sortFormat = decoded.map((item:string) => {
            const sortOrder = item.startsWith('+') ? 1 : -1;
            const fieldName = item.substring(1); // Remove the '+' or '-' prefix
            return [fieldName, sortOrder];
        });

        return sortFormat;
    } catch (error) {
        console.log(error)
        throw { status: 400, message: "Bad Sort Format" }

    }
}

export function getNonFilterableFields(filters: any, fields: string[]): string[] | null {
    const nonFilterableFields: string[] = [];

    Object.keys(filters).forEach(key => {
        if (!fields.includes(key)) {
            nonFilterableFields.push(key);
        }
    });

    if (nonFilterableFields.length > 0) {
        const message = nonFilterableFields.length === 1
            ? "Bad Format:Field is not Filterable: " + nonFilterableFields[0]
            : "Fields are not Filterable: " + nonFilterableFields.join(", ");
        throw { status: 400, message: message };
    }

    return nonFilterableFields.length > 0 ? nonFilterableFields : null;
}

export const QueryToPagination = (query: any) => {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    return { request: { skip, limit } } as PaginationData;
}

export const ResultToPagination = (totalItems: number, pagination: PaginationData) => {
    const currentPage = pagination?.request?.skip / pagination?.request?.limit + 1 || 1;
    const pageSize = pagination?.request?.limit || 10;
    pagination.pagination = { totalItems, totalPages: Math.ceil(totalItems / pageSize), currentPage, pageSize }
    return pagination;
}