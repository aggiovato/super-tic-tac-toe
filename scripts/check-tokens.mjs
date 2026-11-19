// Fails when app code bypasses the semantic token layer: raw colour literals or `--ref-*`
// primitives outside src/styles/. Run by `npm run lint`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      yield* files(path);
    } else if (EXTENSIONS.some((ext) => path.endsWith(ext)) && !path.endsWith('.spec.ts')) {
      yield path;
    }
  }
}

const problems = [];
for (const file of files(ROOT)) {
  if (file.startsWith(ALLOWED_DIR) || file === join('src', 'styles.css')) {
    continue;
  }
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
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
