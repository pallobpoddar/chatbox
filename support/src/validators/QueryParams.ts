import Joi from "joi";

export const queryValidator = Joi.object({
  page: Joi.number().integer().min(0).default(0).label("Page"),
  length: Joi.number().integer().min(0).default(10).label("Length"),
});
