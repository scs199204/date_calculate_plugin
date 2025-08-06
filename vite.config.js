// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      //inputが「キー:値」で指定された場合[name]はキーを参照している
      input: {
        config: path.resolve(__dirname, 'src/js/config.js'),
        // 'desktop': path.resolve(__dirname, 'src/js/desktop.js'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        //Rollup.jsのカスタマイズ、出力ファイル毎にassetFileNamesが呼ばれる
        assetFileNames: (assetInfo) => {
          // CSSファイルの場合
          if (assetInfo.fileName && assetInfo.fileName.endsWith('.css')) {
            return 'css/[name].[ext]';
          }
          // HTMLファイルの場合
          if (assetInfo.fileName && assetInfo.fileName.endsWith('.html')) {
            return 'html/[name].[ext]';
          }
          // 画像ファイルの場合
          if (assetInfo.fileName && /\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.fileName)) {
            return 'image/[name].[ext]';
          }
          // manifest.json の場合
          if (assetInfo.fileName === 'manifest.json') {
            return 'manifest.json';
          }
          // その他のアセット
          return 'assets/[name]-[hash].[ext]';
        },
        format: 'umd',
        name: 'dateCalculatePlugin',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
