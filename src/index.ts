import { Sern, makeDependencies } from '@sern/handler';
import * as ext from '#sern/ext';
import * as config from './config.js';
import { Publisher } from '@sern/publisher';

await makeDependencies(({ add, swap }) => {
  add('@sern/client', () => ext.client);
  swap('@sern/logger', () => ext.logger);
  add('prisma', () => ext.prisma);
  add('cooldowns', () => ext.cooldowns);
  add('publisher', deps => new Publisher(deps['@sern/modules'], deps['@sern/emitter'], deps['@sern/logger']));
});

Sern.init({ commands: ['./dist/commands', './dist/components'], events: ['./dist/events'], defaultPrefix: 'd!' });
