#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DATA_PATH = path.resolve(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const nodes = Array.isArray(data.nodes) ? data.nodes : [];
const edges = Array.isArray(data.edges) ? data.edges : [];
const destinations = Array.isArray(data.destinations) ? data.destinations : [];

const nodeIds = new Set(nodes.map(node => node.id).filter(Boolean));
const adjacency = new Map(nodes.map(node => [node.id, []]));

const problems = [];
const warnings = [];

function addProblem(message) {
  problems.push(message);
  console.error(`  [ERROR] ${message}`);
}

function addWarning(message) {
  warnings.push(message);
  console.warn(`  [WARN]  ${message}`);
}

console.log('=== 学内ナビ データ整合性チェック ===');
console.log(`nodes: ${nodes.length}`);
console.log(`edges: ${edges.length}`);
console.log(`destinations: ${destinations.length}`);

console.log('\n[1] edge の from / to を確認');
for (const [index, edge] of edges.entries()) {
  if (!nodeIds.has(edge.from)) {
    addProblem(`edges[${index}].from = "${edge.from}" は存在しないノードIDです。`);
  }
  if (!nodeIds.has(edge.to)) {
    addProblem(`edges[${index}].to = "${edge.to}" は存在しないノードIDです。`);
  }

  if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
    // 現行プロトタイプは data.json の1エッジを双方向として扱う。
    adjacency.get(edge.from).push(edge.to);
    adjacency.get(edge.to).push(edge.from);
  }
}

console.log('\n[2] 孤立ノードを確認');
for (const node of nodes) {
  const neighbours = adjacency.get(node.id) ?? [];
  if (neighbours.length === 0) {
    addWarning(`孤立ノード: ${node.id} (${node.name ?? node.label ?? '名称なし'})`);
  }
}

console.log('\n[3] 目的地の到達可能性を確認');

const destinationCandidates = new Map();
for (const destination of destinations) {
  if (!destination?.id) continue;
  destinationCandidates.set(destination.id, destination.label ?? destination.id);
}

for (const node of nodes) {
  if (node?.type === 'teacher') {
    destinationCandidates.set(node.id, node.name ?? node.label ?? node.id);
  }
}

function reachableFrom(startId) {
  if (!adjacency.has(startId)) return new Set();
  const visited = new Set([startId]);
  const queue = [startId];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

// 「他のノードから到達可能か」を確認するため、各目的地について
// 目的地以外のノードを1つずつ起点として探索する。
for (const [destinationId, label] of destinationCandidates) {
  if (!nodeIds.has(destinationId)) {
    addProblem(`目的地 "${destinationId}" (${label}) が nodes に存在しません。`);
    continue;
  }

  const otherNodeIds = nodes.map(node => node.id).filter(id => id && id !== destinationId);
  let reachable = false;

  for (const startId of otherNodeIds) {
    const visited = reachableFrom(startId);
    if (visited.has(destinationId)) {
      reachable = true;
      break;
    }
  }

  if (!reachable) {
    addWarning(`到達不可能な目的地: ${destinationId} (${label})`);
  }
}

console.log('\n=== チェック結果 ===');
console.log(`エラー: ${problems.length}`);
console.log(`警告:   ${warnings.length}`);

if (problems.length === 0 && warnings.length === 0) {
  console.log('問題は見つかりませんでした。');
  process.exitCode = 0;
} else {
  if (problems.length > 0) {
    console.log('\n修正が必要な項目:');
    for (const item of problems) console.log(`- ${item}`);
  }
  if (warnings.length > 0) {
    console.log('\n確認が必要な項目:');
    for (const item of warnings) console.log(`- ${item}`);
  }
  // データ編集時に警告も見逃しにくくするため、問題があれば非0終了。
  process.exitCode = 1;
}
