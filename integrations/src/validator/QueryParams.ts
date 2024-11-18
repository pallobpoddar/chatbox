import Joi from "joi";

export const integrationGetQueryParams = Joi.object({
  page: Joi.number().integer().min(0).default(0).label("Page"),
  length: Joi.number().integer().min(0).required().label("Length"),
  filters: Joi.string()
    .pattern(/^\[\[.+,.+,.+\](,\[.+,.+,.+\])*\]$/)
    .message("Invalid filter format"),
  sort: Joi.string()
    .pattern(/^\["[+-]\w+"(,"[+-]\w+")*\]$/)
    .message("Invalid sort format"),
});

export const UpdateIntegrationSchema = Joi.object({
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

