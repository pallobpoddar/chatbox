import Joi from 'joi';
import mongoose from 'mongoose';

// Define a custom validator for ObjectId
const objectIdValidator = (value: any, helpers: { error: (arg0: string) => any; }) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

export const messageValidator = Joi.object({
  recipientId: Joi.string().optional().label('Recipient ID'),
  content: Joi.string().optional().label('Content'),
  ManualType: Joi.string().optional().label('Manual Type'),
  contextId: Joi.string().custom(objectIdValidator, 'ObjectId Validation').optional().label('Context ID'),
//   mediaFiles: Joi.array().items(Joi.object()).optional().label('Media Files')
});