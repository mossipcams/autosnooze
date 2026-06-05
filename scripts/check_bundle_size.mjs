import { stat } from "node:fs/promises";

const artifact = new URL("../custom_components/autosnooze/www/autosnooze-card.js", import.meta.url);
const maxBytes = 210_000;
const { size } = await stat(artifact);

if (size > maxBytes) {
  throw new Error(`Bundle size ${size} bytes exceeds the ${maxBytes} byte budget`);
}

console.log(`Bundle size ${size} bytes is within the ${maxBytes} byte budget`);
