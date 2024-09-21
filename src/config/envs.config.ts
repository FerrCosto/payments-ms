import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVICE: string;
  STRIPE_SECRET_CLAVE: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
}

const envSchema = joi
  .object({
    NATS_SERVICE: joi.array().items(joi.string()).required(),
    STRIPE_SECRET_CLAVE: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVICE: process.env.NATS_SERVICE?.split(','),
});

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvVars = value;

export const envs = {
  nats_service: envVars.NATS_SERVICE,
  stripe_secret_clave: envVars.STRIPE_SECRET_CLAVE,
  stripe_success_url: envVars.STRIPE_SUCCESS_URL,
  stripe_cancel_url: envVars.STRIPE_CANCEL_URL,
};
