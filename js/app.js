import { buildGraph, dijkstra } from './pathfinding.js';
import { createQrScanner, startQrScanner, stopQrScanner, extractNodeIdFromQrValue } from './qr.js';

const els = {
  destinationSearch: document.querySelector('#destination-search'),
  destinationSearchStatus: document.querySelector('#destination-search-status'),
  destination: document.querySelector('#destination-select'),
  scanButton: document.querySelector('#scan-button'),
  manualButton: document.querySelector('#manual-button'),
  qrArea: document.querySelector('#qr-area'),
  reader: document.querySelector('#reader'),
  scanStatus: document.querySelector('#scan-status'),
  stopScanButton: document.querySelector('#stop-scan-button'),
  manualArea: document.querySelector('#manual-area'),
  node: document.querySelector('#node-select'),
  currentLocation: document.querySelector('#current-location-text'),
  guidePanel: document.querySelector('#guide-panel'),
  progress: document.querySelector('#progress-text'),
  guideContent: document.querySelector('#guide-content'),
  arriveButton: document.querySelector('#arrive-button'),
  rescanButton: document.querySelector('#rescan-button'),
  guideNote: document.querySelector('#guide-note'),
  completePanel: document.querySelector('#complete-panel'),
  completeHeading: document.querySelector('#complete-heading'),
  completeText: document.querySelector('#complete-text'),
  resetButton: document.querySelector('#reset-button'),
  error: document.querySelector('#error-banner')
};

let data;
let nodeById;
let graph;
let currentNodeId = null;
let destinationId = null;
let currentPath = [];
let scanner = null;
let destinationOptions = [];

if (!globalThis.APP_BASE_URL) {
  console.warn('config.js が読み込まれていないため、公開URL設定を確認してください。');
}

const setError = message => {
  if (!message) {
    els.error.textContent = '';
    els.error.classList.add('hidden');
    return;
  }
  els.error.textContent = message;
  els.error.classList.remove('hidden');
};

const nodeLabel = id => {
  const node = nodeById.get(id);
  if (!node) return id;
  return `${node.name}（${node.building}・${node.floor}階）`;
};

function normalizeKana(value = '') {
  return String(value)
    .trim()
    .toLocaleLowerCase('ja-JP')
    .normalize('NFKC')
    .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

function createDestinationOptions() {
  const seen = new Set();
  destinationOptions = [];

  for (const destination of data.destinations ?? []) {
    const node = nodeById.get(destination.id);
    if (!node || seen.has(destination.id)) continue;
    seen.add(destination.id);
    destinationOptions.push({
      id: destination.id,
      label: destination.label ?? node.name,
      kana: destination.kana ?? node.kana ?? ''
    });
  }

  for (const node of data.nodes) {
    if (node.type !== 'teacher' || seen.has(node.id)) continue;
    seen.add(node.id);
    destinationOptions.push({ id: node.id, label: node.name, kana: node.kana ?? '' });
  }
}

function renderDestinationOptions(query = '') {
  const normalizedQuery = normalizeKana(query);
  const matches = destinationOptions.filter(option => {
    if (!normalizedQuery) return true;
    const haystack = [option.label, option.kana, option.id].map(normalizeKana);
    return haystack.some(value => value.includes(normalizedQuery));
  });

  const previousValue = els.destination.value;
  els.destination.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = matches.length ? '目的地を選択してください' : '検索結果がありません';
  els.destination.appendChild(placeholder);

  for (const optionData of matches) {
    const option = document.createElement('option');
    option.value = optionData.id;
    option.textContent = optionData.label;
    els.destination.appendChild(option);
  }

  if (matches.some(option => option.id === previousValue)) {
    els.destination.value = previousValue;
  } else if (!normalizedQuery) {
    els.destination.value = '';
  } else {
    destinationId = null;
    els.destination.value = '';
    resetGuide();
  }

  if (!normalizedQuery) {
    els.destinationSearchStatus.textContent = `${matches.length}件の目的地があります。`;
  } else if (matches.length === 0) {
    els.destinationSearchStatus.textContent = '見つかりません。名前や読み仮名の一部を入力してください。';
  } else {
    els.destinationSearchStatus.textContent = `${matches.length}件見つかりました。`;
  }
}

function populateSelectors() {
  createDestinationOptions();
  renderDestinationOptions('');

  for (const node of data.nodes) {
    const option = document.createElement('option');
    option.value = node.id;
    option.textContent = nodeLabel(node.id);
    els.node.appendChild(option);
  }
}

function resetGuide() {
  els.guidePanel.classList.add('hidden');
  els.completePanel.classList.add('hidden');
  els.completeHeading.textContent = '到着しました';
  els.guideContent.replaceChildren();
  els.progress.textContent = '-';
  els.guideNote.textContent = '';
  currentPath = [];
}

function setCurrentNode(nodeId, source = 'manual') {
  const normalizedId = String(nodeId ?? '').trim();

  if (!nodeById.has(normalizedId)) {
    if (source === 'qr') {
      els.scanStatus.textContent = '認識できないコードです。別のQRを読み取るか、手動で現在地を選択してください。';
      setError('認識できないコードです。QRコードを再スキャンするか、「現在地を手動で選択」をご利用ください。');
    } else {
      setError(`指定された地点「${normalizedId}」が data.json にありません。`);
    }
    els.manualArea.classList.remove('hidden');
    return false;
  }

  currentNodeId = normalizedId;
  els.currentLocation.textContent = nodeLabel(normalizedId);
  els.node.value = normalizedId;
  setError('');
  els.manualArea.classList.remove('hidden');

  if (destinationId) renderGuide();
  return true;
}

function renderGuide() {
  resetGuide();
  if (!currentNodeId || !destinationId) return;

  if (currentNodeId === destinationId) {
    els.completePanel.classList.remove('hidden');
    els.completeHeading.textContent = '到着済みです';
    els.completeText.textContent = `${nodeLabel(destinationId)}は現在地です。`;
    return;
  }

  currentPath = dijkstra(graph, currentNodeId, destinationId);
  if (currentPath.length === 0) {
    setError('現在地から目的地までの経路がありません。別の目的地を選ぶか、data.json の経路設定を確認してください。');
    return;
  }

  const nextEdge = currentPath[0];
  const nextNode = nodeById.get(nextEdge.to);

  els.guidePanel.classList.remove('hidden');
  els.progress.textContent = `次の1手 / 残り ${currentPath.length} 区間`;

  const card = document.createElement('div');
  card.className = 'instruction-card';

  const label = document.createElement('div');
  label.className = 'instruction-label';
  label.textContent = '次の経由地点';

  const instruction = document.createElement('p');
  instruction.className = 'instruction-text';
  instruction.textContent = nextEdge.instruction;

  const destinationLine = document.createElement('div');
  destinationLine.className = 'destination-line';
  destinationLine.textContent = `次の地点：${nextNode?.name ?? nextEdge.to}`;

  card.append(label, instruction, destinationLine);
  els.guideContent.appendChild(card);
  els.guideNote.textContent = '次の地点に着いたら「この地点に到着した」を押すか、QRコードを再度読み取ってください。';
}

function destinationChanged() {
  destinationId = els.destination.value || null;
  setError('');
  renderGuide();
}

async function beginScan() {
  await stopScan();
  setError('');
  els.qrArea.classList.remove('hidden');
  els.manualArea.classList.remove('hidden');
  els.scanStatus.textContent = 'QRコードをカメラに映してください。';

  try {
    scanner = createQrScanner({ elementId: 'reader' });
    await startQrScanner(
      scanner,
      async decodedText => {
        const qrNodeId = extractNodeIdFromQrValue(decodedText);
        if (!nodeById.has(qrNodeId)) {
          els.scanStatus.textContent = '認識できないコードです。別のQRを読み取るか、手動で現在地を選択してください。';
          setError('認識できないコードです。QRコードを再スキャンするか、「現在地を手動で選択」をご利用ください。');
          return;
        }

        await stopScan();
        setCurrentNode(qrNodeId, 'qr');
      },
      () => {}
    );
  } catch (error) {
    els.scanStatus.textContent = error.message;
    setError(error.message);
    await stopScan();
    useManual();
  }
}

async function stopScan() {
  await stopQrScanner(scanner);
  scanner = null;
  els.qrArea.classList.add('hidden');
}

function useManual() {
  stopScan();
  els.manualArea.classList.remove('hidden');
  els.node.focus();
}

function arriveAtNextNode() {
  if (!currentPath.length) return;
  setCurrentNode(currentPath[0].to, 'manual');
}

function resetAll() {
  destinationId = null;
  currentNodeId = null;
  currentPath = [];
  els.destinationSearch.value = '';
  renderDestinationOptions('');
  els.destination.value = '';
  els.node.value = '';
  els.currentLocation.textContent = '未設定';
  resetGuide();
  stopScan();
  setError('');
  els.manualArea.classList.remove('hidden');
}

els.destinationSearch.addEventListener('input', event => {
  renderDestinationOptions(event.target.value);
});
els.destination.addEventListener('change', destinationChanged);
els.scanButton.addEventListener('click', beginScan);
els.stopScanButton.addEventListener('click', stopScan);
els.rescanButton.addEventListener('click', beginScan);
els.manualButton.addEventListener('click', useManual);
els.node.addEventListener('change', event => {
  if (event.target.value) setCurrentNode(event.target.value, 'manual');
});
els.arriveButton.addEventListener('click', arriveAtNextNode);
els.resetButton.addEventListener('click', resetAll);

async function init() {
  try {
    const response = await fetch('./data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`data.json の読み込みに失敗しました（${response.status}）。`);
    data = await response.json();
    nodeById = new Map(data.nodes.map(node => [node.id, node]));
    graph = buildGraph(data.nodes, data.edges);
    populateSelectors();
    els.manualArea.classList.remove('hidden');

    const nodeFromUrl = new URLSearchParams(window.location.search).get('node');
    if (nodeFromUrl !== null) {
      const decodedNodeId = nodeFromUrl.trim();
      if (nodeById.has(decodedNodeId)) {
        setCurrentNode(decodedNodeId, 'url');
        els.scanStatus.textContent = 'URLから現在地を設定しました。';
      } else {
        els.scanStatus.textContent = '認識できないコードです。現在地を手動で選択してください。';
        setError('認識できないコードです。URLの node パラメータに指定された地点が data.json にありません。');
      }
    }
  } catch (error) {
    setError(error.message || '初期データの読み込みに失敗しました。');
  }
}

init();
