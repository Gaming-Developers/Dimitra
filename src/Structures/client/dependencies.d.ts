import { CoreDependencies } from '@sern/handler';
import * as ext from '#sern/ext';
import { Publisher } from '@sern/publisher';

declare global {
  interface Dependencies extends CoreDependencies {
    '@sern/logger': ext.Sparky;
    'prisma': ext.PrismaClient;
    'cooldowns': ext.Cooldowns;
    '@sern/client': ext.Dimitra;
    'publisher': Publisher;
  }
}

export {};
