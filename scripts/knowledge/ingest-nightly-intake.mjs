#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { normalizeNightlyBundle } from './normalize-nightly-bundle.mjs';

const root = process.cwd();
const argv = process.argv.slice(2);
const allMode = argv.includes('--all');
const reportIndex = argv.indexOf('--report');
const reportPath = reportIndex >= 0 ? argv[reportIndex + 1] : null;

if (reportIndex >= 0 && !reportPath) {
  console.error('usage: node scripts/knowledge/ingest-nightly-intake.mjs [--all | <bundle.json> ...] [--report <report.json>]');
  process.exit(2);
}

const positional = argv.filter((arg, index) => {
  if (arg === '--all' || arg === '--report') return false;
  if (reportIndex >= 0 && index === reportIndex + 1) return false;
  return !arg.startsWith('--');
});

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else if (/nightly-run-bundle.*\.json$/i.test(entry.name)) files.push(target);
  }
  return files;
}

function canonicalBundlePath(file) {
  return path.resolve(root, file);
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizedDigest(rawBundle) {
  const normalized = normalizeNightlyBundle(rawBundle);
  return {
    normalized,
    digest: crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
  };
}

function safeName(id) {
  return id.replace(/[:/]/g, '-');
}

function receiptPathFor(runId) {
  return path.join(root, 'knowledge', 'receipts', `${safeName(`${runId}-ingest`)}.json`);
}

function runNode(args) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024
  });
}

function parseJsonOutput(result, label) {
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label} returned non-JSON output: ${result.stdout.slice(0, 2000)}`);
  }
}

let bundleFiles;
if (allMode) {
  bundleFiles = walk(path.join(root, 'knowledge', 'intake', 'nightly'));
} else {
  bundleFiles = positional.map(canonicalBundlePath);
}

bundleFiles = [...new Set(bundleFiles.map((file) => path.resolve(file)))];
if (bundleFiles.length === 0) {
  console.error('no nightly bundle files selected');
  process.exit(2);
}

const prepared = [];
for (const file of bundleFiles) {
  try {
    const rawBytes = fs.readFileSync(file);
    const raw = JSON.parse(rawBytes.toString('utf8'));
    const { normalized, digest } = normalizedDigest(raw);
    prepared.push({
      file,
      rawBytes,
      raw,
      normalized,
      digest,
      sortKey: normalized?.run?.retrievalWindow?.to || normalized?.run?.runId || path.relative(root, file)
    });
  } catch (error) {
    prepared.push({ file, prepareError: error.message, sortKey: path.relative(root, file) });
  }
}

prepared.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.file.localeCompare(b.file));

const results = [];
for (const item of prepared) {
  const relativeBundlePath = path.relative(root, item.file);
  if (item.prepareError) {
    results.push({
      status: 'BLOCKED_WITH_EXPLICIT_REASON',
      bundlePath: relativeBundlePath,
      reason: `bundle parse/normalize failed: ${item.prepareError}`
    });
    continue;
  }

  const runId = item.normalized?.run?.runId;
  const bundleSha256 = sha256Buffer(item.rawBytes);
  if (!runId) {
    results.push({
      status: 'BLOCKED_WITH_EXPLICIT_REASON',
      bundlePath: relativeBundlePath,
      bundleSha256,
      normalizedDigest: item.digest,
      reason: 'normalized bundle has no run.runId'
    });
    continue;
  }

  const receiptPath = receiptPathFor(runId);
  const relativeReceiptPath = path.relative(root, receiptPath);

  if (fs.existsSync(receiptPath)) {
    try {
      const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      if (receipt.runId === runId && receipt.normalizedDigest === item.digest) {
        results.push({
          status: 'DUPLICATE_ALREADY_PRESENT',
          runId,
          bundlePath: relativeBundlePath,
          bundleSha256,
          normalizedDigest: item.digest,
          ingestReceiptPath: relativeReceiptPath,
          generatedRecordCount: Array.isArray(receipt.files) ? receipt.files.length : null
        });
      } else {
        results.push({
          status: 'BLOCKED_WITH_EXPLICIT_REASON',
          runId,
          bundlePath: relativeBundlePath,
          bundleSha256,
          normalizedDigest: item.digest,
          ingestReceiptPath: relativeReceiptPath,
          reason: 'existing ingest receipt does not match this bundle normalized digest/runId'
        });
      }
    } catch (error) {
      results.push({
        status: 'BLOCKED_WITH_EXPLICIT_REASON',
        runId,
        bundlePath: relativeBundlePath,
        bundleSha256,
        normalizedDigest: item.digest,
        ingestReceiptPath: relativeReceiptPath,
        reason: `existing ingest receipt could not be verified: ${error.message}`
      });
    }
    continue;
  }

  try {
    const dry = parseJsonOutput(
      runNode(['scripts/knowledge/ingest-nightly-run.mjs', relativeBundlePath, '--dry-run']),
      `dry-run ${relativeBundlePath}`
    );

    if (dry.status !== 'validated' || dry.runId !== runId || dry.normalizedDigest !== item.digest) {
      throw new Error('dry-run result did not match expected status/runId/normalizedDigest');
    }

    const receipt = parseJsonOutput(
      runNode(['scripts/knowledge/ingest-nightly-run.mjs', relativeBundlePath]),
      `ingest ${relativeBundlePath}`
    );

    if (receipt.runId !== runId || receipt.normalizedDigest !== item.digest) {
      throw new Error('ingest receipt did not match expected runId/normalizedDigest');
    }
    if (!fs.existsSync(receiptPath)) {
      throw new Error(`expected ingest receipt missing: ${relativeReceiptPath}`);
    }

    results.push({
      status: 'INGESTED_WITH_RECEIPT',
      runId,
      bundlePath: relativeBundlePath,
      bundleSha256,
      normalizedDigest: item.digest,
      dryRunResult: 'validated',
      plannedFiles: dry.plannedFiles,
      ingestReceiptPath: relativeReceiptPath,
      generatedRecordCount: Array.isArray(receipt.files) ? receipt.files.length : null
    });
  } catch (error) {
    results.push({
      status: 'BLOCKED_WITH_EXPLICIT_REASON',
      runId,
      bundlePath: relativeBundlePath,
      bundleSha256,
      normalizedDigest: item.digest,
      ingestReceiptPath: relativeReceiptPath,
      reason: error.message
    });
  }
}

const report = {
  type: 'NightlyIntakeCoordinatorReceipt',
  schemaVersion: '1.0.0',
  createdAt: new Date().toISOString(),
  mode: allMode ? 'backfill' : 'selected',
  selectedBundleCount: bundleFiles.length,
  statusCounts: results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {}),
  overallStatus: results.some((result) => result.status === 'BLOCKED_WITH_EXPLICIT_REASON')
    ? 'PARTIAL_OR_BLOCKED'
    : 'COMPLETE',
  results
};

if (reportPath) {
  const absoluteReportPath = path.resolve(root, reportPath);
  fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}

console.log(JSON.stringify(report, null, 2));
