// Vueの createApp をインポート
import { createApp } from 'vue';
// 作成したVueコンポーネントをインポート
import DateCalculateConfigApp from '../components/DateCalculateConfigApp.vue';

(async function (PLUGIN_ID) {
  'use strict';
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★ ドロップダウン共通関数 (async/await の外側で定義)
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  function setDropDown(fieldArray) {
    const result = [];
    for (const field of fieldArray) {
      let id = field.code;
      let name = escapeHtml(field.code);
      if (field.hasOwnProperty('subtableCode')) {
        id += ',' + field.subtableCode; //サブテーブルの場合、「フィールド名,サブテーブル名」
        name += '(' + escapeHtml(field.subtableCode) + ')'; //ドロップダウンへの表示内容：サブテーブルの場合、「フィールド名(サブテーブル名)」
      }
      const addItem = {
        id: id,
        name: name,
      };
      result.push(addItem);
    }
    return result;
  }

  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★ エスケープ文字の置換関数 (async/await の外側で定義)
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  function escapeHtml(htmlstr) {
    // HTMLエスケープ文字を正しく修正します
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★ 非同期処理（設定取得とフィールド情報取得）を Vue アプリ作成より前に行う
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  let { recalculation, calculateParameters } = config;

  // nullの場合の初期値
  if (!recalculation) {
    recalculation = '不要';
  }

  if (!calculateParameters) {
    calculateParameters = [{ id: 1, targetField: '', addMonthCount: 0, calculateDay: '月末日', notDay: '前日', outputField: '' }];
  } else {
    // JSON.parse は await より前に行う
    calculateParameters = JSON.parse(config['calculateParameters']);
  }

  // Dateフィールドの一覧を取得し、ドロップダウン用に変換 (ここで await を使う)
  let dateFields = []; // 初期値
  try {
    dateFields = await KintoneConfigHelper.getFields(['DATE']); //指定した型のフィールドの一覧を抽出
  } catch (error) {
    console.error('Kintone fields fetch error:', error);
  }
  const optionTargetField = setDropDown(dateFields); // フィールド情報をドロップダウン用のデータに変換 (await 完了後に行う)

  // Vueコンポーネントに渡す初期データとオプション
  const initialConfig = {
    recalculation,
    calculateParameters,
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
    optionTargetField: optionTargetField,
  });
  const vm = app.mount('#app');
})(kintone.$PLUGIN_ID);
