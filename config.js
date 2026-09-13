// GitHub Pagesなど、公開先のURLだけをここで変更します。
// 末尾は / にしてください。
const APP_BASE_URL = 'https://example.github.io/school-nav/';

// Browser: window.APP_BASE_URL / globalThis.APP_BASE_URL
// Node.js: require('../config.js').APP_BASE_URL
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_BASE_URL };
} else {
  globalThis.APP_BASE_URL = APP_BASE_URL;
}
