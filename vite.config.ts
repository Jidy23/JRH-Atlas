import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
export default defineConfig({
 root:path('./web'),
 publicDir:path('./public'),
 plugins:[react()],
 resolve:{alias:{'@':path('./')}},
 css:{postcss:{plugins:[tailwindcss()]}},
 server:{watch:{usePolling:true}},
 build:{
  outDir:path('./dist'),
  emptyOutDir:true,
  // three.js is one vendor dependency used only by the lazily-loaded 3D viewer.
  // It is split into its own chunk so the engine is cached across deploys and
  // every app-owned chunk stays small. The warning threshold is raised to match
  // that single unavoidable vendor chunk (~700 kB minified); it is not a licence
  // for app code to grow.
  chunkSizeWarningLimit:700,
  rollupOptions:{output:{manualChunks:(id:string)=>{
   if(id.includes('node_modules/three'))return 'three';
   if(id.includes('node_modules/react'))return 'react';
   return undefined;
  }}},
 },
});
