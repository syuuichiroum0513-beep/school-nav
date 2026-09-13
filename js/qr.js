
export function extractNodeIdFromQrValue(value) {
  const text = String(value ?? '').trim();

  if (!text.startsWith('https://')) {
    return text;
  }

  try {
    const url = new URL(text);
    return url.searchParams.get('node')?.trim() ?? '';
  } catch {
    return '';
  }
}

export function createQrScanner({ elementId }) {
  if (!window.Html5Qrcode) {
    throw new Error('QRスキャナライブラリを読み込めませんでした。');
  }
  return new window.Html5Qrcode(elementId);
}

function toCameraError(error) {
  const name = error?.name || '';
  const message = String(error?.message || error || '');

  if (name === 'NotAllowedError' || /permission|denied|not allowed/i.test(message)) {
    return new Error('カメラの使用が許可されていません。ブラウザのカメラ権限を確認するか、「現在地を手動で選択」をご利用ください。');
  }

  if (name === 'NotFoundError' || /not found|no camera|camera.*found/i.test(message)) {
    return new Error('カメラを利用できない端末です。「現在地を手動で選択」をご利用ください。');
  }

  if (name === 'NotReadableError' || /not readable|device.*busy|camera.*busy/i.test(message)) {
    return new Error('カメラを利用できません。ほかのアプリで使用中でないか確認するか、「現在地を手動で選択」をご利用ください。');
  }

  if (name === 'SecurityError' || /secure context|https/i.test(message)) {
    return new Error('この環境ではカメラを利用できません。HTTPS環境で開くか、「現在地を手動で選択」をご利用ください。');
  }

  return new Error('QRスキャンを開始できませんでした。「現在地を手動で選択」をご利用ください。');
}

export async function startQrScanner(scanner, onResult, onError) {
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      decodedText => onResult(decodedText),
      errorMessage => onError?.(errorMessage)
    );
  } catch (error) {
    throw toCameraError(error);
  }
}

export async function stopQrScanner(scanner) {
  if (!scanner) return;
  try {
    await scanner.stop();
    scanner.clear();
  } catch {
    // 既に停止している場合は無視
  }
}
