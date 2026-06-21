// WebGL diagnostics and logging utilities

export const logNavigationEvent = (from: string, to: string): void => {
  console.log(`[Navigation] ${from} -> ${to}`);
};

export const logWebGLError = (error: string): void => {
  console.error(`[WebGL Error] ${error}`);
};

export const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};
