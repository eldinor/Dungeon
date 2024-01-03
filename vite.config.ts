import { defineConfig } from 'vite'
import { rmSync, cpSync } from 'node:fs';
import svgr from "vite-plugin-svgr";
import path from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { createHtmlPlugin } from 'vite-plugin-html'

const OUTPUT_DIR = 'dist'

export default defineConfig((): object => {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });

  cpSync(path.resolve(__dirname, 'public'), `${OUTPUT_DIR}/public`, { recursive: true })

  return {
    plugins: [
      {
        name: 'fix-recast',
        transform(code, id) {
          if (id.includes('recast-detour.js')) {
            return code.replace(`this["Recast"]`, 'window["Recast"]');
          }
        }
      },
      svgr(),
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              minify: true,
              outDir: OUTPUT_DIR
            },
          }
        },
        {
          entry: 'electron/preload.ts',
          vite : {
            build: {
              minify: true,
              outDir: OUTPUT_DIR
            }
          }
        }
      ]),
      renderer(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: 'Electron template',
          }
        }
      }),
    ],
    resolve: {
      alias: [ { find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
    server: {
      host: 'localhost',
      port: process.env.PORT || 8080
    },
    css: { 
      transformer: 'lightningcss' 
    },
    build: { 
      cssMinify: 'lightningcss' 
    }
  }
})
