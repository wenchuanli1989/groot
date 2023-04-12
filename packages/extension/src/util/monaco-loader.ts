import { getContext } from "context";

let loaderPromise: Promise<any>;

export const monacoLoader = (path?: string) => {

  let vsPath = path;
  if (!vsPath) {
    const assetUrl = getContext().extension.extensionVersion.assetUrl
    const url = new URL(assetUrl)
    vsPath = `${assetUrl.replace(url.pathname, '')}/monaco-editor/vs`
  }

  return loaderPromise || (loaderPromise = new Promise((resolve) => {
    const scriptEle = document.createElement('script');

    scriptEle.addEventListener('load', () => {
      (window['require'] as any).config({ paths: { vs: vsPath } });

      (window['require'] as any)(['vs/editor/editor.main'], () => {
        resolve(null);
      });
    });

    scriptEle.src = `${vsPath}/loader.js`;
    document.head.appendChild(scriptEle);
  }))
}