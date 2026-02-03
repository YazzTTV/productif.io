import { promises as fs } from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const OUTPUT_PATH = path.resolve('public/qr/scan.svg');
const URL = 'https://www.productif.io/scan';

const svg = await QRCode.toString(URL, {
  type: 'svg',
  margin: 1,
  width: 512,
  color: {
    dark: '#0F172A',
    light: '#FFFFFF',
  },
});

await fs.writeFile(OUTPUT_PATH, svg, 'utf8');
console.log(`QR code generated at ${OUTPUT_PATH}`);
