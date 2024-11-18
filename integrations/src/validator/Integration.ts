import Joi from "joi";


export const InputIntegrationSchema = Joi.object({
    phoneNoId: Joi.string()
      .required()
      .label("Phone Number ID")
      .messages({
        "string.base": `"Phone Number ID" must be a string`,
        "any.required": `"Phone Number ID" is required`,
      }),
  
    apiKey: Joi.string()
      .required()
      .label("API Key")
      .messages({
        "string.base": `"API Key" must be a string`,
        "any.required": `"API Key" is required`,
      }),
  });