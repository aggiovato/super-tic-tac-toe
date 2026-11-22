// The architecture check on the real tree, and on probe files written into it (and always removed),
// so a check that stops biting fails here instead of passing in silence.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { check } from './check-architecture.mjs';

const probes = [];
function probe(path, code) {
  writeFileSync(path, code);
  probes.push(path);
}

describe('the architecture check', () => {
  afterEach(() => {
    for (const path of probes.splice(0)) rmSync(path, { recursive: true, force: true });
  });

  it('passes on the code as it is', () => {
    expect(check()).toEqual([]);
  });

  it('reports a block importing one its map does not allow', () => {
    probe('src/app/core/storage/arch-probe.ts', "export { GameLayout } from '@layout';\n");
    expect(check()).toContain(
      'src/app/core/storage/arch-probe.ts: @storage may not import @layout',
    );
  });

  it('lets specs and testing folders import more', () => {
    probe('src/app/core/storage/arch-probe.spec.ts', "export { GameLayout } from '@layout';\n");
    expect(check()).toEqual([]);
  });

  it('reports blocks that import each other', () => {
    // @match already imports @storage; this closes the loop.
    probe('src/app/core/storage/arch-probe.ts', "export { withMatch } from '@match';\n");
    expect(
      check().some((problem) => problem.startsWith('Blocks import each other in a cycle')),
    ).toBe(true);
  });

  it('reports a folder at a block level without its index.ts', () => {
    mkdirSync('src/app/core/arch-probe');
    probes.push('src/app/core/arch-probe');
    writeFileSync('src/app/core/arch-probe/thing.ts', 'export const thing = 1;\n');
    expect(check()).toContain('src/app/core/arch-probe: a block without an index.ts');
  });
});
