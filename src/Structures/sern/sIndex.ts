/******************LOGGING******************/
import { Sparky } from './handler-ext/logging.js';
export const logger = new Sparky('debug', 'highlight');
export type { Sparky };
/*******************************************/

/******************ADAPTERS*****************/
import { Prisma } from '../adapters/Prisma.js';
export type { PrismaClient } from '@prisma/client';
export type { Prisma };
export { Paginator } from '../adapters/Google/GooglePaginator.js';
export { GoogleCredentials } from '../adapters/Google/credentials.js';
import Cooldowns from '../adapters/Cooldowns.js';
export type { Cooldowns };
export { fetchNewForms } from '../adapters/Google/reponses.js';
export * as utils from '../Utils.js';

export const prisma = new Prisma(logger);
export const cooldowns = new Cooldowns(prisma);
export * from '../Utils.js';
/*******************************************/

/******************CLIENT*******************/
import { Dimitra } from '../client/Dimitra.js';
export const client = new Dimitra(cooldowns);
export type { Dimitra };
/*******************************************/

/******************PLUGINS******************/
export * from './plugins/assertFields.js';
export * from './plugins/buttonConfirmation.js';
export * from './plugins/channelType.js';
export * from './plugins/confirmation.js';
export * from './plugins/cooldown.js';
export * from './plugins/disable.js';
export * from './plugins/dmOnly.js';
export * from './plugins/ownerOnly.js';
export * from './plugins/permCheck.js';
export * from './plugins/requirePermission.js';
export * from './plugins/serverOnly.js';
/*******************************************/

/******************LOADER*******************/
export { env } from './handler-ext/load.js';
/*******************************************/

/******************TYPES********************/
export interface InternalCooldownConfig {
  cooldownType: CooldownTypes;
  duration: number | [number, 's' | 'm' | 'd' | 'h'];
  userId: string;
  actionId: string;
  guildId?: string;
  channelId?: string;
}

export enum CooldownTypes {
  perUser = 'perUser',
  perUserPerGuild = 'perUserPerGuild',
  perGuild = 'perGuild',
  global = 'global',
  perChannel = 'perChannel',
  perUserPerChannel = 'perUserPerChannel'
}

export const cooldownDurations = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24
};

export type NonEmptyArray<T> = [T, ...T[]];

export interface CMDProps {
  category: string;
  examples?: string;
}

export type IGoogleCredentials = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
};
/*******************************************/
