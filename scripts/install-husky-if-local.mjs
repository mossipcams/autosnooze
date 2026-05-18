import husky from 'husky';

const ci = process.env.CI === 'true' || process.env.CI === '1';
const huskyDisabled = process.env.HUSKY === '0' || process.env.HUSKY === 'false';

if (ci || huskyDisabled) {
  console.log('Skipping Husky install outside local developer environment.');
  process.exit(0);
}

try {
  const message = husky();
  if (message) {
    console.log(message);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Unable to install Husky hooks: ${message}`);
}
