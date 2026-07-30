#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/knowledge/write-receipt.mjs <file>');
  process.exit(2);
}
const absolute = path.resolve(root, target);
if (!fs.existsSync(absolute)) {
  console.error(`Missing file: ${target}`);
  process.exit(1);
}
const bytes = fs.readFileSync(absolute);
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
const receipt = {
  target: path.relative(root, absolute).replaceAll('\\', '/'),
  sha256: hash,
  bytes: bytes.length,
  generatedAt: new Date().toISOString()
};
fs.mkdirSync(path.join(root, 'knowledge', 'receipts'), { recursive: true });
const output = path.join(root, 'knowledge', 'receipts', `${path.basename(target)}.receipt.json`);
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(output);
