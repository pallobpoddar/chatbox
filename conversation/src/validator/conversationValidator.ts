import Joi from 'joi';
import path from 'path';

// Define a custom validator for file extensions
const fileExtensionValidator = (value: any, helpers: { error: (arg0: string) => any; }) => {
  if (Array.isArray(value) && value.every((file: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  })) {
    return value;
  }
  return helpers.error('any.invalid');
};

export const updateConversationSchema = Joi.object({
  remove: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
            return parsed;
          } else {
            return helpers.error('array.base'); // Use Joi's built-in error message
          }
        } catch (e) {
          return helpers.error('any.invalid'); // Use Joi's built-in error message
        }
      }
      return value; // Return as is if no value
    }),
  add: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
            return parsed;
          } else {
            return helpers.error('array.base'); // Use Joi's built-in error message
          }
        } catch (e) {
          return helpers.error('any.invalid'); // Use Joi's built-in error message
        }
      }
      return value; // Return as is if no value
    }),
  name: Joi.string().optional().allow('').messages({
    'string.base': '`name` must be a string',
  }),
  photo: Joi.array().items(
    Joi.object({
      originalname: Joi.string().required()
    }).custom(fileExtensionValidator, 'File Extension Validation')
  ).optional().messages({
    'array.base': '`photo` must be an array',
    'any.invalid': '`photo` contains invalid file extension',
  })
});
