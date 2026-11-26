import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/assets/', import.meta.url));
function dimensions(b, ext) {
  if (ext === '.png') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let p = 12; p + 8 <= b.length;) {
    const type = b.toString('ascii', p, p+4), len = b.readUInt32LE(p+4), q=p+8;
    if (type === 'VP8X' && len >= 10) return [1+b.readUIntLE(q+4,3),1+b.readUIntLE(q+7,3)];
    if (type === 'VP8L' && len >= 5) {const v=b.readUInt32LE(q+1);return [1+(v&16383),1+((v>>>14)&16383)];}
    if (type === 'VP8 ' && len >= 10) return [b.readUInt16LE(q+6)&16383,b.readUInt16LE(q+8)&16383];
    p=q+len+(len%2);
  }
  throw new Error('Unsupported WebP dimensions');
}
export function generateSvgAssets() {
  let count=0;
  function walk(dir) {
    for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
      const p=path.join(dir,item.name);
      if(item.isDirectory()) {walk(p);continue;}
      const ext=path.extname(p).toLowerCase();
      if(ext!=='.png' && ext!=='.webp') continue;
      const b=fs.readFileSync(p), [w,h]=dimensions(b,ext);
      const mime=ext==='.png'?'image/png':'image/webp';
      const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><image width="'+w+'" height="'+h+'" href="data:'+mime+';base64,'+b.toString('base64')+'"/></svg>\n';
      if(!fs.existsSync(p+'.svg') || fs.readFileSync(p+'.svg','utf8')!==svg) fs.writeFileSync(p+'.svg',svg);
      count++;
    }
  }
  walk(root);
  console.log('Generated '+count+' self-contained SVG artwork wrappers');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) generateSvgAssets();
