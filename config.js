const APP_BASE_URL = 'https://syuuichiroum0513-beep.github.io/school-nav/';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_BASE_URL };
} else {
  globalThis.APP_BASE_URL = APP_BASE_URL;
}
