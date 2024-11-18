import Joi from "joi";

export const usersGetQueryParams = Joi.object({
  page: Joi.number().integer().min(0).default(0).label("Page"),
  length: Joi.number().integer().min(0).required().label("Length"),
  filters: Joi.string()
    .pattern(/^\[\[.+,.+,.+\](,\[.+,.+,.+\])*\]$/)
    .message("Invalid filter format"),
  sort: Joi.string()
    .pattern(/^\["[+-]\w+"(,"[+-]\w+")*\]$/)
    .message("Invalid sort format"),
});

export const userUsernameQueryParams = Joi.object({
  username: Joi.string()
    .alphanum() // Allows only alphanumeric characters
    .min(3) // Minimum length of 3 characters
    .max(30), // Maximum length of 30 characters
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/), // Allows only digits, with a length between 10 and 15
}).xor("username", "phone");
