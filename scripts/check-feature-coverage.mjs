#!/usr/bin/env node
/**
 * Acceptance-coverage guard. Our CI runs Gherkin specs through a matrix of
 * "areas", each pinned to explicit `.features-gen/...` paths (so concurrent
 * jobs split the suite). The risk: a NEW e2e/features/<x>/*.feature file in a
 * directory no matrix area covers would NEVER run, yet CI stays green — a
 * silently dead test.
 *
 * This fails the build if any e2e/features/*.feature file is not covered by an
 * area path in .github/workflows/ci.yml. It maps each feature file to the
 * generated spec path (e2e/... -> .features-gen/e2e/...) and checks that some
 * matrix `paths:` entry is a prefix of it.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const FEATURES_DIR = join(ROOT, 'e2e', 'features');
const CI_FILE = join(ROOT, '.github', 'workflows', 'ci.yml');

/** Every .feature file under e2e/features, repo-relative with forward slashes. */
function featureFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...featureFiles(full));
    else if (entry.endsWith('.feature')) out.push(relative(ROOT, full).split('\\').join('/'));
  }
  return out;
}

/** All matrix `paths:` tokens from ci.yml (space-separated .features-gen globs). */
function matrixPaths() {
  const ci = readFileSync(CI_FILE, 'utf8');
  const paths = [];
  for (const line of ci.split('\n')) {
    const m = line.match(/^\s*paths:\s*(.+)$/);
    if (m) paths.push(...m[1].trim().split(/\s+/));
  }
  return paths;
}

// A feature's generated spec lives at .features-gen/<feature path>.spec.js; an
// area covers it when an area path is a prefix (dir) or the exact spec.
const covers = (areaPath, genPath) =>
  genPath === areaPath ||
  genPath.startsWith(areaPath.endsWith('/') ? areaPath : `${areaPath}/`) ||
  `${genPath}.spec.js`.startsWith(areaPath);

const paths = matrixPaths();
const uncovered = featureFiles(FEATURES_DIR).filter((f) => {
  const gen = `.features-gen/${f}`;
  return !paths.some((p) => covers(p, gen));
});

if (uncovered.length > 0) {
  console.error(`\n✖ ${uncovered.length} .feature file(s) not mapped to a CI acceptance area:`);
  for (const f of uncovered) console.error(`    ${f}`);
  console.error(
    '\n  Add the feature dir to a matrix `area.paths` in .github/workflows/ci.yml,\n' +
      '  or these scenarios will never run in CI.\n',
  );
  process.exit(1);
}

console.log(`\n✓ All ${featureFiles(FEATURES_DIR).length} .feature files map to a CI area.\n`);
