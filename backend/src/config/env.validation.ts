import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4o'),
  PORT: Joi.number().default(3000),
});
