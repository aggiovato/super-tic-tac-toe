// ESLint's boundary rules on small snippets: each must still fail where it should and pass where it
// should, so a rule left behind by a rename (its pattern no longer matching) is caught here.
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({
  cwd: process.cwd(),
  // Only the boundary rules, without type information: the snippets are not files on disk.
  overrideConfig: { languageOptions: { parserOptions: { projectService: false, project: null } } },
  ruleFilter: ({ ruleId }) => /no-restricted-(?:imports|syntax)$/.test(ruleId),
});

async function problems(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.message);
}

const use = (specifier) => `import * as other from '${specifier}';\nexport const used = other;\n`;

describe('the boundary rules', () => {
  it.each([
    ['src/engine/tictac/probe.ts', '@ui'],
    ['src/engine/catalog/probe.ts', '@match'],
    ['src/engine/dots/core/probe.ts', '@angular/core'],
    ['src/engine/super-3t/ai/probe.ts', '@preferences'],
    ['src/engine/super-3t/challenge/probe.ts', '@super3t/session'],
  ])('keep %s free of %s', async (file, specifier) => {
    expect(await problems(file, use(specifier))).toHaveLength(1);
  });

  it('keep an engine free of its own computer player', async () => {
    expect(await problems('src/engine/classic/core/probe.ts', use('@classic/ai'))).toHaveLength(1);
  });

  it.each([
    ['src/app/features/games/dots/ui/probe.ts', '@super3t/core'],
    ['src/engine/classic/ai/probe.ts', '@dots/core'],
  ])('keep %s from importing another game (%s)', async (file, specifier) => {
    expect(await problems(file, use(specifier))).toEqual(['A game never imports another game.']);
  });

  it('refuses a relative path into another block', async () => {
    expect(
      await problems('src/app/core/match/probe.ts', use('../storage/records.model')),
    ).toHaveLength(1);
  });

  it('refuses an alias into a block’s files', async () => {
    expect(await problems('src/app/layout/probe.ts', use('@super3t/core/engine'))).toHaveLength(1);
  });

  it.each([
    ['src/engine/super-3t/ai/probe.ts', '@super3t/core'],
    ['src/engine/catalog/probe.ts', '@dots/core'],
    ['src/app/features/games/dots/ui/probe.ts', '@ui'],
    ['src/app/layout/probe.ts', '@super3t/ui/preview'],
    ['src/engine/super-3t/ai/probe.spec.ts', '@super3t/core/testing'],
  ])('let %s import %s', async (file, specifier) => {
    expect(await problems(file, use(specifier))).toEqual([]);
  });
});
