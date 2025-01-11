import fs from 'node:fs/promises';
import { scheduler } from 'node:timers/promises';
import { mm, MockApplication } from '@eggjs/mock';
import { escape, getFilepath, DELAY } from './utils.js';

describe('test/override.test.ts', () => {
  let app: MockApplication;

  after(() => app && app.close());
  afterEach(mm.restore);
  // for debounce
  afterEach(() => scheduler.wait(500));

  describe('overrideDefault', () => {
    before(() => {
      mm.env('local');
      app = mm.cluster({
        baseDir: 'override',
      });
      app.debug();
      return app.ready();
    });
    it('should reload', async () => {
      const filepath = getFilepath('override/app/service/a.js');
      await fs.writeFile(filepath, '');
      await scheduler.wait(DELAY);

      await fs.unlink(filepath);
      app.expect('stdout', /a\.js/);
    });

    it('should not reload', async () => {
      app.debug();
      const filepath = getFilepath('override/app/no-trigger/index.js');
      await fs.writeFile(filepath, '');
      await scheduler.wait(DELAY);

      await fs.unlink(filepath);
      app.notExpect('stdout', /index\.js/);
    });
  });

  describe('overrideIgnore', () => {
    before(() => {
      mm.env('local');
      app = mm.cluster({
        baseDir: 'override-ignore',
      });
      app.debug();
      return app.ready();
    });
    it('should reload', async () => {
      const filepath = getFilepath('override-ignore/app/web/a.js');
      await fs.writeFile(filepath, '');
      await scheduler.wait(DELAY);

      await fs.unlink(filepath);
      app.expect('stdout', new RegExp(escape(`reload worker because ${filepath}`)));
    });

    it('should not reload', async () => {
      app.debug();
      const filepath = getFilepath('override-ignore/app/public/index.js');
      await fs.writeFile(filepath, '');
      await scheduler.wait(DELAY);

      await fs.unlink(filepath);
      app.notExpect('stdout', new RegExp(escape(`reload worker because ${filepath} change`)));
    });
  });
});
