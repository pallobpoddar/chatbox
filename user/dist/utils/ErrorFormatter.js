"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrorFormatter = void 0;
const ValidationErrorFormatter = (error_object) => {
    const { error } = error_object;
    if (error) {
        const validationErrors = error.details.map((detail) => ({
            message: detail.message,
            field: detail.context?.key
        }));
        throw { status: 400, message: 'Validation failed', errors: validationErrors };
    }
};
exports.ValidationErrorFormatter = ValidationErrorFormatter;
