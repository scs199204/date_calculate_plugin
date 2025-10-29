// Vueの createApp をインポート
import { createApp } from 'vue';
// 作成したVueコンポーネントをインポート
import DateCalculateConfigApp from '../components/DateCalculateConfigApp.vue';

(async function (PLUGIN_ID) {
  'use strict';
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★ 非同期処理（設定取得とフィールド情報取得）を Vue アプリ作成より前に行う
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);

  // Vueコンポーネントに渡す初期データとオプション
  const initialConfig = {
    recalculation: config.recalculation ?? '不要',
    calculateParameters: config.calculateParameters ? JSON.parse(config.calculateParameters) : [{ id: 1, targetField: '', addMonthCount: 0, calculateDay: '月末日', notDay: '前日', outputField: '' }],
  };

  let appElement = document.getElementById('app');
  if (!appElement) {
    appElement = document.createElement('div');
    appElement.id = 'app';
    document.body.appendChild(appElement);
  }
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //Vueのオブジェクト作成 (setup 関数は async にしない)
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  const app = createApp(DateCalculateConfigApp, {
    initialConfig: initialConfig,
  });
  const vm = app.mount('#app');
})(kintone.$PLUGIN_ID);
