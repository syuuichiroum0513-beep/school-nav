#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const { APP_BASE_URL } = require('../config.js');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data.json');
const OUTPUT_DIR = path.join(ROOT, 'qrcodes');

const LABEL_HEIGHT = 70;
const QR_SIZE = 500;
const CANVAS_WIDTH = QR_SIZE;
const CANVAS_HEIGHT = QR_SIZE + LABEL_HEIGHT;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.nodes)) {
    throw new Error('data.json に nodes 配列がありません。');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const ids = new Set();

  for (const node of data.nodes) {
    if (!node?.id) {
      console.warn('[WARN] id がないノードをスキップしました:', node);
      continue;
    }

    if (ids.has(node.id)) {
      console.warn(`[WARN] 重複したノードIDを検出しました: ${node.id}`);
      continue;
    }
    ids.add(node.id);

    const qrUrl = new URL(APP_BASE_URL);
    qrUrl.search = '';
    qrUrl.searchParams.set('node', node.id);

    const qrPng = await QRCode.toBuffer(qrUrl.toString(), {
      type: 'png',
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    const label = node.name ?? node.label ?? node.id;
    const labelSvg = `
      <svg width="${CANVAS_WIDTH}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="30" text-anchor="middle"
              font-family="Arial, 'Noto Sans JP', sans-serif"
              font-size="20" fill="#20242a">${escapeXml(label)}</text>
        <text x="50%" y="53" text-anchor="middle"
              font-family="Arial, sans-serif"
              font-size="12" fill="#68707a">${escapeXml(node.id)}</text>
      </svg>`;

    const outputPath = path.join(OUTPUT_DIR, `${node.id}.png`);

    await sharp(qrPng)
      .extend({ top: 0, bottom: LABEL_HEIGHT, left: 0, right: 0, background: '#ffffff' })
      .composite([{ input: Buffer.from(labelSvg), top: QR_SIZE, left: 0 }])
      .png()
      .toFile(outputPath);

    console.log(`生成: qrcodes/${node.id}.png`);
    console.log(`  QR内容: ${qrUrl.toString()}`);
  }

  console.log(`\n完了: ${ids.size} 個のQRコードを生成しました。`);
}

main().catch(error => {
  console.error('[ERROR]', error.message);
  process.exitCode = 1;
});
