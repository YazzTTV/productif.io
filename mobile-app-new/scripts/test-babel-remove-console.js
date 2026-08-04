/**
 * Verifie que les console.log partent bien en Release et restent en Debug.
 *   node scripts/test-babel-remove-console.js
 *
 * Pourquoi ce test existe : react-native-xcode.sh ne pose PAS NODE_ENV=production
 * pendant un archive Release, il se contente de DEV=false. Une condition babel
 * ecrite sur process.env.NODE_ENV compile donc sans erreur et ne se declenche
 * jamais, ce qui laisse les logs de diagnostic lisibles en production sans que
 * rien ne le signale. La detection se fait sur api.caller, comme babel-preset-expo.
 */

const path = require('path');
const babel = require('@babel/core');

const projectRoot = path.join(__dirname, '..');

const SOURCE = `
console.log('[appBlocking] pose du bouclier', token);
console.warn('attention');
console.error('boum');
export const x = 1;
`;

function transform(caller) {
  return babel.transformSync(SOURCE, {
    filename: path.join(projectRoot, 'utils/appBlocking.ts'),
    cwd: projectRoot,
    root: projectRoot,
    caller,
    babelrc: false,
    configFile: path.join(projectRoot, 'babel.config.js'),
  }).code;
}

const metroCaller = {
  name: 'metro',
  bundler: 'metro',
  platform: 'ios',
  engine: 'hermes',
};

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}`);
  }
}

console.log('\nRelease (caller.isDev === false)');
{
  const out = transform({ ...metroCaller, isDev: false });
  check('console.log retire', !out.includes('console.log'));
  check('console.warn conserve', out.includes('console.warn'));
  check('console.error conserve', out.includes('console.error'));
}

console.log('\nDebug (caller.isDev === true)');
{
  const out = transform({ ...metroCaller, isDev: true });
  check('console.log conserve', out.includes('console.log'));
}

console.log('\nSans caller, sur BABEL_ENV=production');
{
  const previous = process.env.BABEL_ENV;
  process.env.BABEL_ENV = 'production';
  const out = transform({ ...metroCaller });
  check('console.log retire', !out.includes('console.log'));
  if (previous === undefined) delete process.env.BABEL_ENV;
  else process.env.BABEL_ENV = previous;
}

if (failures > 0) {
  console.error(`\n${failures} echec(s)`);
  process.exit(1);
}
console.log('\ntout est passe');
