<template>
  <div class="plugin-config-container">
    <h1 class="page-title">日付計算プラグイン設定</h1>

    <div class="setting-section">
      <h2 class="section-title">基本設定</h2>
      <div class="setting-item">
        <label class="label-text">レコード編集画面表示の際の再計算</label>
        <select v-model="recalculation">
          <option v-for="itemRecalculation in optionRecalculation" :value="itemRecalculation.id" :key="itemRecalculation.id">
            {{ itemRecalculation.name }}
          </option>
        </select>
      </div>
    </div>

    <hr class="section-divider" />

    <div class="setting-section">
      <h2 class="section-title">日付算出一覧</h2>
      <div v-if="hasError" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th class="target-field-header"><span class="title">日付フィールド</span></th>
            <th class="month-header"><span class="title">月数</span></th>
            <th class="wider-column"><span class="title">算出日付</span></th>
            <th class="wider-column"><span class="title">応当日なしの場合</span></th>
            <th class="target-field-header"><span class="title">結果フィールド</span></th>
            <th class="table-header-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(calculateParameter, index) in calculateParameters" :key="calculateParameter.id">
            <td>
              <select
                v-model="calculateParameter.targetField"
                :class="{ 'input-error': isSubtableError(calculateParameter) || isDuplicateError(calculateParameter) || isSameFieldError(calculateParameter) }"
              >
                <option v-for="itemTargetField in optionTargetField" :value="itemTargetField.id" :key="itemTargetField.id">
                  {{ itemTargetField.name }}
                </option>
              </select>
            </td>
            <td>
              <input v-model.number="calculateParameter.addMonthCount" type="number" class="text-input month-input" :class="{ 'input-error': !isMonthCountValid(calculateParameter.addMonthCount) }" />
            </td>
            <td>
              <select v-model="calculateParameter.calculateDay">
                <option v-for="itemCalculateDay in optionCalculateDay" :value="itemCalculateDay.id" :key="itemCalculateDay.id">
                  {{ itemCalculateDay.name }}
                </option>
              </select>
            </td>
            <td>
              <select v-model="calculateParameter.notDay">
                <option v-for="itemNotDay in optionNotDay" :value="itemNotDay.id" :key="itemNotDay.id">
                  {{ itemNotDay.name }}
                </option>
              </select>
            </td>
            <td>
              <select
                v-model="calculateParameter.outputField"
                :class="{ 'input-error': isSubtableError(calculateParameter) || isDuplicateError(calculateParameter) || isSameFieldError(calculateParameter) }"
              >
                <option v-for="itemTargetField in optionTargetField" :value="itemTargetField.id" :key="itemTargetField.id">
                  {{ itemTargetField.name }}
                </option>
              </select>
            </td>
            <td class="table-actions">
              <button @click="addItem(index)" type="button" class="action-icon-button add-button" title="行を追加"></button>
              <button @click="removeItem(index)" type="button" class="action-icon-button remove-button" title="行を削除"></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="button-group">
      <button @click="register" class="action-button primary-button">登録</button>
      <button @click="cancel" class="action-button secondary-button" type="button">キャンセル</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { setDropDown, cancel } from './kintonePluginCommonFunction.js';

//config.jsから渡される引数(変数、関数)
const props = defineProps(['initialConfig']);

const optionTargetField = ref([]);

const optionRecalculation = ref([
  { id: '不要', name: '不要' },
  { id: '再計算', name: '再計算' },
]);
const optionCalculateDay = ref([
  { id: '月末日', name: '月末日' },
  { id: '月初日', name: '月初日' },
  { id: '応当日', name: '応当日' },
]);
const optionNotDay = ref([
  { id: '前日', name: '前日' },
  { id: '翌日', name: '翌日' },
]);

const recalculation = ref(props.initialConfig.recalculation);
const calculateParameters = ref(props.initialConfig.calculateParameters);

const hasError = ref(false);
const errorMessage = ref('');

// 月数入力のバリデーション
const isMonthCountValid = (value) => {
  return value === '' || (Number.isInteger(Number(value)) && Number(value) >= -240 && Number(value) <= 240);
};

// サブテーブルのバリデーション
const isSubtableError = (param) => {
  if (param.targetField === '' || param.outputField === '') return false;
  const inputFieldArray = param.targetField.split(',');
  const outputFieldArray = param.outputField.split(',');
  return inputFieldArray[1] !== outputFieldArray[1];
};

// フィールド重複のバリデーション
const isDuplicateError = (param) => {
  const allOutputFields = calculateParameters.value.map((p) => p.outputField).filter((f) => f !== '');
  const count = allOutputFields.filter((f) => f === param.outputField).length;
  return count > 1;
};

// 同じフィールドのバリデーション
const isSameFieldError = (param) => {
  return param.targetField === param.outputField && param.targetField !== '';
};

// onMountedで初期データを取得
onMounted(async () => {
  try {
    // Dateフィールドの一覧を取得し、ドロップダウン用に変換 (ここで await を使う)
    const dateFields = await KintoneConfigHelper.getFields(['DATE']); //指定した型のフィールドの一覧を抽出
    optionTargetField.value = setDropDown(dateFields, true); // フィールド情報をドロップダウン用のデータに変換 (await 完了後に行う)
  } catch (error) {
    hasError.value = true;
    errorMessage.value = error.message;
  }
});

// 全体のエラーチェック
const validate = () => {
  errorMessage.value = '';
  hasError.value = false;

  // 月数チェック
  for (const item of calculateParameters.value) {
    if (!isMonthCountValid(item.addMonthCount)) {
      errorMessage.value = '月数は-240～240の整数で入力してください。';
      hasError.value = true;
      return false;
    }
  }

  const outputFields = calculateParameters.value.map((p) => p.outputField).filter((field) => field !== '');
  const uniqueOutputFields = new Set(outputFields);

  if (outputFields.length !== uniqueOutputFields.size) {
    const duplicatedFields = [...new Set(outputFields.filter((field, index, self) => self.indexOf(field) !== index))];
    const duplicatedFieldNames = duplicatedFields.map((fieldCode) => {
      const field = props.optionTargetField.find((f) => f.id === fieldCode);
      return field ? field.name : fieldCode;
    });
    errorMessage.value = `結果フィールドが重複しています：${duplicatedFieldNames.join(', ')}`;
    hasError.value = true;
    return false;
  }

  for (const item of calculateParameters.value) {
    if (isSubtableError(item)) {
      errorMessage.value = '日付フィールドと結果フィールドは同じサブテーブルを選択してください。';
      hasError.value = true;
      return false;
    }
    if (isSameFieldError(item)) {
      errorMessage.value = '日付フィールドと結果フィールドに同じフィールドは指定できません。';
      hasError.value = true;
      return false;
    }
  }

  return true;
};

const register = () => {
  if (!validate()) {
    return;
  }

  try {
    const param = {
      recalculation: recalculation.value,
      calculateParameters: JSON.stringify(calculateParameters.value),
    };

    kintone.plugin.app.setConfig(param, () => {
      alert('プラグインの設定が保存されました！アプリを更新してください！');
      window.location.href = '/k/admin/app/flow?app=' + kintone.app.getId();
    });
  } catch (e) {
    console.error('name: ' + e.name + ' message: ' + e.message);
    hasError.value = true;
    errorMessage.value = '設定の保存中にエラーが発生しました。';
  }
};

const addItem = (index) => {
  calculateParameters.value.splice(index + 1, 0, { id: Date.now(), targetField: '', addMonthCount: 0, calculateDay: '月末日', notDay: '前日', outputField: '' });
};

const removeItem = (index) => {
  calculateParameters.value.splice(index, 1);
  if (calculateParameters.value.length === 0) {
    calculateParameters.value.push({ id: Date.now(), targetField: '', addMonthCount: 0, calculateDay: '月末日', notDay: '前日', outputField: '' });
  }
};
</script>

<style scoped>
/* 基本的なリセットとフォント */
.plugin-config-container {
  font-family: 'Inter', 'Noto Sans JP', sans-serif; /* モダンなフォント優先 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 30px;
  max-width: 1200px; /* テーブル幅に合わせて最大幅を調整 */
  margin: 30px auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); /* 柔らかい影 */
  border: 1px solid #e0e7eb; /* 控えめな境界線 */
}

/* ヘッダー */
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f4f7;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 20px;
  border-left: 4px solid #4a90e2; /* アクセントカラー */
  padding-left: 10px;
}

.section-divider {
  border: 0;
  border-top: 1px solid #f0f4f7;
  margin: 30px 0;
}

/* 設定項目 */
.setting-section {
  margin-bottom: 30px;
}

.setting-item {
  margin-bottom: 20px;
}

.label-text {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
  font-size: 15px;
}

/* フォーム要素の共通スタイル */
.text-input,
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  background-color: #fcfdfe;
  font-size: 15px;
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box; /* paddingとborderを幅に含める */
}

.text-input:focus,
select:focus {
  border-color: #4a90e2; /* フォーカス時のアクセントカラー */
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2); /* 柔らかい影 */
  outline: none;
  background-color: #ffffff;
}

/* セレクトボックスのカスタム矢印 */
select {
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  cursor: pointer;
}

/* エラー表示 */
.input-error {
  border-color: #e74c3c !important; /* 強調された赤色 */
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2) !important;
}

.error-message {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}

/* データテーブル（色設定）スタイル */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  border: 1px solid #e0e7eb; /* 控えめな境界線 */
  border-radius: 8px;
  overflow: hidden; /* 角丸を適用するため */
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  border: 1px solid #f0f4f7; /* セル間の区切り線 */
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background-color: #f7f9fb;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

/* 列幅の調整 */
.wider-column {
  width: 15%;
}
.target-field-header {
  width: 25%;
}
.month-header {
  width: 10%;
  white-space: nowrap;
}
.table-header-action {
  width: 90px; /* 操作列の幅固定 */
  text-align: center;
}

/* テーブル内のフォーム要素 */
.data-table .text-input,
.data-table select {
  padding: 8px 10px; /* テーブル内で少し小さめに */
  font-size: 14px;
}
.month-input {
  width: 100%; /* 親要素(td)の幅に合わせる */
  min-width: 50px;
}

/* 行追加・削除ボタン */
.table-actions {
  white-space: nowrap;
  text-align: center;
}

.action-icon-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0 5px;
  width: 28px; /* ボタンのサイズ */
  height: 28px;
  display: inline-flex; /* flexboxで中央揃え */
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* 丸いボタン */
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.add-button {
  background-color: #e6f7ff; /* 薄い青 */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%234a90e2%22%20d%3D%22M19%2013h-6v6h-2v-6H5v-2h6V5h2v6h6v2z%22%2F%3E%3C%2Fsvg%3E'); /* モダンなプラスアイコン */
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px;
}

.remove-button {
  background-color: #ffebeb; /* 薄い赤 */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23e74c3c%22%20d%3D%22M19%2013H5v-2h14v2z%22%2F%3E%3C%2Fsvg%3E'); /* モダンなマイナスアイコン */
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px;
}

.action-icon-button:hover {
  transform: translateY(-2px); /* 少し浮き上がるエフェクト */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.add-button:hover {
  background-color: #d1efff;
}

.remove-button:hover {
  background-color: #ffd1d1;
}

/* フッターのボタン */
.button-group {
  text-align: center;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #f0f4f7;
}

.action-button {
  padding: 12px 30px;
  margin: 0 10px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* 柔らかい影 */
}

.primary-button {
  background-color: #4a90e2; /* メインカラー */
  color: white;
}

.primary-button:hover {
  background-color: #357bd8; /* 少し濃く */
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
}

.secondary-button {
  background-color: #eceff1; /* 薄いグレー */
  color: #555;
  border: 1px solid #cfd8dc;
}

.secondary-button:hover {
  background-color: #e0e4e6;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
}

.required-mark {
  color: #e74c3c; /* 赤色 */
  font-weight: bold;
  margin-left: 4px; /* ラベルとの間隔 */
}
</style>
