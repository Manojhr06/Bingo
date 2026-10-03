import fs from 'node:fs';
import path from 'node:path';

// Valid 1x1 transparent PNG data URI byte buffer
const base64Png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64Png, 'base64');

const assetsDir = path.resolve('assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png'].forEach((file) => {
  fs.writeFileSync(path.join(assetsDir, file), buffer);
  console.log(`Created ${file}`);
});
