import { PaginationData } from "./ApiResponse";

export const FilterParamsDecoder = (filters: string) => {
    try {
        if (!filters || filters.length === 0) return {};
        const decoded = JSON.parse(filters.replace(/'/g, '"'));
        let filterQuery: any = {};

        // Function to process each filter group
        const processFilters = (filterGroup: any[]) => {
            let query: any = {};

            filterGroup.forEach((filter: any) => {
                const [field, operator, value] = filter;

                switch (operator) {
                    case 'eq':
                        query[field] = value;
                        break;
                    case 'like':
                        query[field] = { $regex: new RegExp(value, 'i') };
                        break;
                    case 'gt':
                        query[field] = { $gt: value };
                        break;
                    case 'lt':
                        query[field] = { $lt: value };
                        break;
                    case 'gte':
                        query[field] = { $gte: value };
                        break;
                    case 'lte':
                        query[field] = { $lte: value };
                        break;
                    default:
                        break;
                }
            });

            return query;
        };

        // Check if top-level is an OR operation
        if (Array.isArray(decoded[0][0])) {
            // OR operation
            filterQuery['$or'] = decoded.map((orGroup: any[]) => processFilters(orGroup));
        } else {
            // AND operation
            filterQuery['$and'] = processFilters(decoded);
        }

        return filterQuery;
    } catch (error) {
        console.error(error);
        throw { status: 400, message: "Bad Filter Format" };
    }
};

if (require.main === module) {
    const data = [
        [
          "firstName",
          "gt",
          "imx"
        ],
        [
          "lastName",
          "eq",
          "ppx"
        ]
    ]
  
    console.log(FilterParamsDecoder(JSON.stringify(data)))
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

    // Helper function to recursively check fields
    const checkFields = (filter: any) => {
        Object.keys(filter).forEach(key => {
            if (key === '$or' || key === '$and') {
                // Ignore MongoDB logical operators
                filter[key].forEach((subFilter: any) => checkFields(subFilter));
            } else if (!fields.includes(key)) {
                nonFilterableFields.push(key);
            }
        });
    };

    checkFields(filters);

    if (nonFilterableFields.length > 0) {
        const message = nonFilterableFields.length === 1
            ? "Bad Format:Field is not Filterable: " + nonFilterableFields[0]
            : "Fields are not Filterable: " + nonFilterableFields.join(", ");
        throw { status: 400, message: message };
    }

    return nonFilterableFields.length > 0 ? nonFilterableFields : null;
}

export const QueryToPagination = (query: any) => {
    const page = parseInt(query.page);
    const pageSize = parseInt(query.length);
    const skip = (page - 0) * pageSize;
    const limit = pageSize;
    return { request: { skip, limit } } as PaginationData;
}

export const ResultToPagination = (totalItems: number, pagination: PaginationData) => {
    const currentPage = pagination?.request?.skip / pagination?.request?.limit || 0;
    const pageSize = pagination?.request?.limit || 10;
    pagination.pagination = { totalItems, totalPages: Math.ceil(totalItems / pageSize), currentPage, pageSize }
    return pagination;
}