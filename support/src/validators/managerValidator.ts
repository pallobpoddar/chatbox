import Joi from "joi";

const managerValidator = Joi.object({
  userId: Joi.string().trim().min(1),
  managers: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().trim().min(1).required(),
        role: Joi.string().valid("agent", "supervisor").default("agent"),
      })
    )
    .min(1)
    .required()
    .custom((managers, helpers) => {
      const ids = managers.map(
        (manager: { id: string; role: "agent" | "supervisor" }) => manager.id
      );
      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        return helpers.error("custom.invalidManagerId");
      }
      return managers;
    })
    .messages({
      "custom.invalidManagerId": "Manager IDs must be unique.",
    }),
  isDeleted: Joi.boolean().default(false),
});

export default managerValidator;
