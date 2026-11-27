// Fails when app code bypasses the semantic token layer: raw colour literals or `--ref-*`
// primitives outside src/styles/, or a media query on the two layouts that does not read as
// `layout-queries.ts` says. Run by `npm run lint` over src/, and by the pre-commit hook over the
// staged files it is given as arguments.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';

const ROOT = 'src';
const ALLOWED_DIR = join('src', 'styles');
const EXTENSIONS = ['.css', '.html', '.ts'];
const RULES = [
  { pattern: /#[0-9a-fA-F]{3,8}\b(?![-\w])/g, message: 'raw hex colour; use a semantic token' },
  {
    pattern: /\b(?:rgb|rgba|hsl|hsla|oklch)\(/g,
    message: 'raw colour function; use a semantic token',
  },
  { pattern: /--ref-[\w-]+/g, message: 'primitive token; use a semantic token' },
];

const checked = (path) =>
  path.startsWith(ROOT + '/') &&
  EXTENSIONS.some((ext) => path.endsWith(ext)) &&
  !path.endsWith('.spec.ts') &&
  !path.startsWith(ALLOWED_DIR) &&
  path !== join('src', 'styles.css');

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      yield* files(path);
    } else if (checked(path)) {
      yield path;
    }
  }
}

// Given files (relative or absolute) are checked when they are app code; none means all of src/.
const given = process.argv.slice(2).map((path) => (isAbsolute(path) ? relative('.', path) : path));
const targets = given.length > 0 ? given.filter(checked) : [...files(ROOT)];

// The two layouts' media queries come from one place (`src/app/ui/dom/layout-queries.ts`): a
// stylesheet query on the 48rem / 5:4 breakpoint must read exactly one of them.
const LAYOUTS = [
  ...readFileSync(join('src', 'app', 'ui', 'dom', 'layout-queries.ts'), 'utf8').matchAll(
    /_LAYOUT = '([^']+)'/g,
  ),
].map(([, query]) => query);
const layoutProblem = (line) => {
  const media = /@media\s+(.+?)\s*\{/.exec(line)?.[1];
  if (!media || !/aspect-ratio/.test(media) || !/(?:48|47\.99)rem/.test(media)) return null;
  return LAYOUTS.includes(media)
    ? null
    : 'layout breakpoint; use WIDE_LAYOUT or NARROW_LAYOUT words';
};

const problems = [];
for (const file of targets) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      const layout = file.endsWith('.css') ? layoutProblem(line) : null;
      if (layout) problems.push(`${relative('.', file)}:${index + 1}  ${layout}`);
      for (const { pattern, message } of RULES) {
        for (const match of line.matchAll(pattern)) {
          problems.push(`${relative('.', file)}:${index + 1}  ${match[0]}  ${message}`);
        }
      }
    });
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} token problem(s).`);
  process.exit(1);
}
