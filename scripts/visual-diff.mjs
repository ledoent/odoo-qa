#!/usr/bin/env node
/**
 * Generate visual diffs between baseline and current checkpoint screenshots.
 *
 * Usage:
 *   node scripts/visual-diff.mjs --baseline=path/to/baseline --current=path/to/checkpoints
 *
 * Output:
 *   test-results/diffs/           — diff overlay PNGs (red = changed pixels)
 *   test-results/diff-report.json — summary with per-file change counts
 *
 * Requires: pngjs (npm install pngjs). Uses Playwright's bundled pixelmatch.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { PNG } from "pngjs";

import pixelmatchModule from "pixelmatch";
const pixelmatch = pixelmatchModule;

// Parse args
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : null;
};

const baselineDir = getArg("baseline") || "test-results/baselines";
const currentDir = getArg("current") || "test-results/checkpoints";
const outputDir = getArg("output") || "test-results/diffs";
const threshold = parseFloat(getArg("threshold") || "0.1");

if (!existsSync(baselineDir)) {
  console.error(`Baseline directory not found: ${baselineDir}`);
  console.log(JSON.stringify({ total: 0, changed: 0, unchanged: 0, missing_baseline: true, diffs: [] }));
  process.exit(0);
}

if (!existsSync(currentDir)) {
  console.error(`Current directory not found: ${currentDir}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const baselineFiles = new Set(readdirSync(baselineDir).filter((f) => f.endsWith(".png")));
const currentFiles = readdirSync(currentDir).filter((f) => f.endsWith(".png"));

const report = { total: 0, changed: 0, unchanged: 0, new: 0, diffs: [] };

for (const file of currentFiles) {
  report.total++;

  if (!baselineFiles.has(file)) {
    report.new++;
    report.diffs.push({ name: file.replace(".png", ""), status: "new", changedPixels: 0, percentage: 0 });
    continue;
  }

  try {
    const baseImg = PNG.sync.read(readFileSync(resolve(baselineDir, file)));
    const curImg = PNG.sync.read(readFileSync(resolve(currentDir, file)));

    // Handle size differences
    const width = Math.min(baseImg.width, curImg.width);
    const height = Math.min(baseImg.height, curImg.height);

    // Resize if needed (crop to smaller)
    const baseData = cropImageData(baseImg, width, height);
    const curData = cropImageData(curImg, width, height);

    const diff = new PNG({ width, height });
    const changedPixels = pixelmatch(baseData, curData, diff.data, width, height, { threshold });
    const totalPixels = width * height;
    const percentage = ((changedPixels / totalPixels) * 100).toFixed(2);

    if (changedPixels > 0) {
      report.changed++;
      writeFileSync(resolve(outputDir, `diff-${file}`), PNG.sync.write(diff));
      report.diffs.push({
        name: file.replace(".png", ""),
        status: "changed",
        changedPixels,
        percentage: parseFloat(percentage),
        width,
        height,
      });
    } else {
      report.unchanged++;
    }
  } catch (err) {
    report.diffs.push({ name: file.replace(".png", ""), status: "error", error: err.message });
  }
}

writeFileSync(resolve(outputDir, "diff-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

function cropImageData(img, width, height) {
  if (img.width === width && img.height === height) return img.data;
  const cropped = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcOffset = y * img.width * 4;
    const dstOffset = y * width * 4;
    img.data.copy(cropped, dstOffset, srcOffset, srcOffset + width * 4);
  }
  return cropped;
}
