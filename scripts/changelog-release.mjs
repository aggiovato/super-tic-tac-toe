// Run by `npm version` (the `version` script, so by `task release:*`) after the bump and before the
// release commit: turns the Unreleased section of CHANGELOG.md into the new version with today's
// date, opens a fresh Unreleased section, updates the compare links and stages the file, so the
// "chore(release): vX.Y.Z" commit carries it. Refuses to release an empty Unreleased section.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'CHANGELOG.md';
const REPO = 'https://github.com/aggiovato/super-tic-tac-toe';
const version = process.env['npm_package_version'];
if (!version) {
  throw new Error('Run through `npm version` (task release:*), which sets npm_package_version.');
}

const text = readFileSync(FILE, 'utf8');
const heading = '## [Unreleased]';
const start = text.indexOf(heading);
if (start < 0) {
  throw new Error(`${FILE} has no "${heading}" section.`);
}
const next = text.indexOf('\n## [', start + heading.length);
const body = text.slice(start + heading.length, next < 0 ? undefined : next).trim();
if (!body) {
  throw new Error(`Nothing under "${heading}" in ${FILE}: write the release notes first.`);
}

const previous = /^\[Unreleased\]: .*compare\/(v[\d.]+)\.\.\.HEAD$/m.exec(text)?.[1];
// Local calendar date (YYYY-MM-DD), the day the release is cut where it is cut.
const date = new Date().toLocaleDateString('sv-SE');
let updated = text.replace(heading, `${heading}\n\n## [${version}] - ${date}`);
updated = updated.replace(
  /^\[Unreleased\]: .*$/m,
  `[Unreleased]: ${REPO}/compare/v${version}...HEAD\n` +
    `[${version}]: ${previous ? `${REPO}/compare/${previous}...v${version}` : `${REPO}/releases/tag/v${version}`}`,
);
writeFileSync(FILE, updated);
execFileSync('git', ['add', FILE]);
console.log(`${FILE}: Unreleased is now ${version} (${date}).`);
