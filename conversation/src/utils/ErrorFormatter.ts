export const ValidationErrorFormatter = (error_object: any) => {
    const {error} = error_object;
    if (error) {
        const validationErrors = error.details.map((detail: any) => ({
            message: detail.message,
            field: detail.context?.key
        }));
        throw { status: 400, message: 'Validation failed', errors: validationErrors };
    }
}