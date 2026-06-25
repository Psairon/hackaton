import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  ANTHROPIC_API_KEY: Joi.string().required(),
  PORT: Joi.number().default(3000),
});
