/**
 * デバイス検出ユーティリティ
 */

/**
 * モバイルデバイスかどうかを判定
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * タブレットかどうかを判定
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;

  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
};

/**
 * タッチデバイスかどうかを判定
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 画面サイズを取得
 */
export const getScreenSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * ブレークポイントを判定
 */
export const getBreakpoint = () => {
  const width = getScreenSize().width;

  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};

/**
 * モバイルブラウザかどうかを判定
 */
export const isMobileBrowser = () => {
  return isMobile() || (isTouchDevice() && getScreenSize().width < 768);
};

/**
 * デバイス情報を取得
 */
export const getDeviceInfo = () => {
  return {
    isMobile: isMobile(),
    isTablet: isTablet(),
    isTouchDevice: isTouchDevice(),
    screenSize: getScreenSize(),
    breakpoint: getBreakpoint(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : ''
  };
};

/**
 * オリエンテーションを取得
 */
export const getOrientation = () => {
  if (typeof window === 'undefined') return 'landscape';

  const { width, height } = getScreenSize();
  return height > width ? 'portrait' : 'landscape';
};

/**
 * ビューポート高さを取得（モバイルブラウザのアドレスバーを考慮）
 */
export const getViewportHeight = () => {
  if (typeof window === 'undefined') return 0;

  // visualViewportがサポートされている場合
  if (window.visualViewport) {
    return window.visualViewport.height;
  }

  return window.innerHeight;
};

/**
 * iOS デバイスかどうかを判定
 */
export const isIOS = () => {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Android デバイスかどうかを判定
 */
export const isAndroid = () => {
  if (typeof window === 'undefined') return false;

  return /Android/.test(navigator.userAgent);
};

/**
 * PWA として実行されているかどうかを判定
 */
export const isPWA = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

/**
 * デバイスの向きの変更を監視
 */
export const watchOrientation = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getOrientation());
  };

  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);

  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
};

/**
 * 画面サイズの変更を監視
 */
export const watchScreenSize = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getScreenSize());
  };

  window.addEventListener('resize', handler);

  // 初回実行
  callback(getScreenSize());

  return () => {
    window.removeEventListener('resize', handler);
  };
};

/**
 * ブレークポイントの変更を監視
 */
export const watchBreakpoint = (callback) => {
  if (typeof window === 'undefined') return () => {};

  let currentBreakpoint = getBreakpoint();

  const handler = () => {
    const newBreakpoint = getBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      currentBreakpoint = newBreakpoint;
      callback(newBreakpoint);
    }
  };

  window.addEventListener('resize', handler);

  // 初回実行
  callback(currentBreakpoint);

  return () => {
    window.removeEventListener('resize', handler);
  };
};
