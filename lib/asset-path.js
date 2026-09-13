export function assetPath(path){const base=typeof document==='undefined'?'/':new URL('.',document.baseURI).pathname;return base+path.replace(/^\//,'');}
