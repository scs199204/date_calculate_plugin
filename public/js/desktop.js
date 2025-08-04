(function (PLUGIN_ID) {
  'use strict';
  // Get plugin configuration settings
  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }
  // Get each settings
  let CONFIG_RECALCULATION = CONFIG.recalculation;
  let CONFIG_CALCULATE_PARAMETERS = CONFIG.calculateParameters;

  if (!CONFIG_RECALCULATION) {
    CONFIG_RECALCULATION = '不要';
  }

  if (!CONFIG_CALCULATE_PARAMETERS) {
    //配列→オブジェクトの配列に変換
    CONFIG_CALCULATE_PARAMETERS = [{ id: 1, targetField: '', addMonthCount: 0, calculateDay: '月末日', notDay: '前日', outputField: '' }];
  } else {
    CONFIG_CALCULATE_PARAMETERS = JSON.parse(CONFIG['calculateParameters']);
  }

  //◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆
  //◆　レコード表示のイベント
  //◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆
  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.index.edit.show'], (event) => {
    /** サブテーブルの行追加時のイベントを作成
     * @param {array[string]} fieldArray - イベント内で使用するサブテーブルのフィールド名
     * @returns {function} テーブル変更時(行の追加・削除)のイベントハンドラ
     */
    const generateSubtableEventHandler = (fieldArray) => {
      const FieldArray = fieldArray; //編集不可にするフィールドの配列
      return (event) => {
        let changes = event.changes.row;

        if (changes == null || changes === '') {
        } else {
          //行追加の場合、編集不可にする。
          for (const item of FieldArray) {
            changes.value[item.output].disabled = true;
          }
        }
        return event;
      };
    };

    /** 日付フィールド変更時のイベントを作成
     * @param {string} argTargetField - イベント対象のフィールド名(変更した際にイベントが発火するフィールド)
     * @param {number} argAddMonthCount - 加算する月数
     * @param {string} argCalculateDay - 算出する日付(月末日・応当日)
     * @param {string} argNotDay - 応当日が存在しない場合の考慮(前日・翌日)
     * @param {string} argOutputField - 計算結果を出力するフィールド名
     * @returns  {function} フィールド変更時のイベントハンドラ
     */
    const generateFieldChangeEventTargetHandler = (argTargetField, argAddMonthCount, argCalculateDay, argNotDay, argOutputField) => {
      const targetField = argTargetField;
      const addMonthCount = argAddMonthCount;
      const calculateDay = argCalculateDay;
      const notDay = argNotDay;
      const outputField = argOutputField;
      return (event) => {
        const changes = event.changes;
        let target; //編集対象のフィールドをサブテーブル、サブテーブル以外に関わらず「target」とする為の考慮
        if (!event.changes.hasOwnProperty('row') || event.changes.row == null || event.changes.row === '') {
          target = event.record; //サブテーブル以外のフィールドの場合
        } else {
          target = event.changes.row.value; //サブテーブルの場合
        }

        if (changes == null || changes === '') {
          target[outputField].value = ''; //日付フィールドを消した場合は結果フィールドもクリア
        } else {
          target[outputField].value = 日付変換(target[targetField].value, addMonthCount, calculateDay, notDay); //日付を算出
        }
        return event;
      };
    };

    //ここからレコード表示の際のイベント
    const record = event.record;

    /** @type {object[]} - プラグインの設定がサブテーブル内のフィールドだった場合の設定内容 */
    const targetSubtable = [];

    //プラグインの設定内容に応じたイベント追加などの処理
    for (const configItem of CONFIG_CALCULATE_PARAMETERS) {
      //日付フィールド、算出する日付、応当日が存在しない場合の考慮、結果フィールドのどれかが未入力の場合、読み飛ばし
      if (!configItem.targetField || !configItem.calculateDay || !configItem.notDay || !configItem.outputField) {
        continue;
      }

      //対象のフィールドがサブテーブル内のフィールドの場合、カンマ区切りとしているのでカンマがあれば分割する
      const inputFieldArray = configItem.targetField.split(',');
      const outputFieldArray = configItem.outputField.split(',');

      //サブテーブルに対する設定の場合、日付および結果フィールドが同じサブテーブル内のフィールドかどうか判定
      if (inputFieldArray.length > 1 && outputFieldArray.length > 1 && inputFieldArray[1] == outputFieldArray[1]) {
        //サブテーブル内のフィールドの場合、targetSubtable作成
        if (!targetSubtable.hasOwnProperty(inputFieldArray[1])) {
          targetSubtable[inputFieldArray[1]] = [];
        }
        const addItem = {
          input: inputFieldArray[0],
          output: outputFieldArray[0],
          addMonthCount: configItem.addMonthCount,
          calculateDay: configItem.calculateDay,
          notDay: configItem.notDay,
        };
        targetSubtable[inputFieldArray[1]].push(addItem); //対象フィールド追加
      } else {
        //サブテーブルではない場合、ここで編集不可設定および、必要に応じて再計算を行う。
        record[outputFieldArray[0]].disabled = true;
        if (event.type == 'app.record.edit.show' && CONFIG_RECALCULATION == '再計算') {
          record[outputFieldArray[0]].value = 日付変換(record[inputFieldArray[0]].value, configItem.addMonthCount, configItem.calculateDay, configItem.notDay);
        }
      }

      //フィールド変更時のイベントを登録
      const フィールド変更時のイベント = generateFieldChangeEventTargetHandler(inputFieldArray[0], configItem.addMonthCount, configItem.calculateDay, configItem.notDay, outputFieldArray[0]);
      const handleName = ['app.record.create.change.' + inputFieldArray[0], 'app.record.edit.change.' + inputFieldArray[0], 'app.record.index.edit.change.' + inputFieldArray[0]];

      kintone.events.off(handleName, フィールド変更時のイベント);
      kintone.events.on(handleName, フィールド変更時のイベント);
    }

    //サブテーブルの場合の処理(事前に作成した、targetSubtableから諸々設定を行う)
    for (const [subtableName, fieldArray] of Object.entries(targetSubtable)) {
      //サブテーブルに対する行追加・削除時のイベント追加
      const サブテーブル行追加時のイベント = generateSubtableEventHandler(fieldArray);
      kintone.events.off(['app.record.create.change.' + subtableName, 'app.record.edit.change.' + subtableName], サブテーブル行追加時のイベント);
      kintone.events.on(['app.record.create.change.' + subtableName, 'app.record.edit.change.' + subtableName], サブテーブル行追加時のイベント);
      //結果フィールドの編集不可設定および、必要に応じて再計算を行う。
      for (const row of record[subtableName].value) {
        for (const item of fieldArray) {
          row.value[item.output].disabled = true;
          if (event.type == 'app.record.edit.show' && CONFIG_RECALCULATION == '再計算') {
            row.value[item.output].value = 日付変換(row.value[item.input].value, item.addMonthCount, item.calculateDay, item.notDay); //日付を算出
          }
        }
      }
    }
    return event;
  });

  //★★★★★★★★★★★★★★★★★★★
  /** プラグインの設定内容から、日付を算出
   * @param {string} 入力日付 - 日付フィールドの値「yyyy-MM-dd」
   * @param {number} 加算月数 - 加算する月数
   * @param {string} 算出日付 - 「月末日」、「月初日」、「応当日」
   * @param {string} 該当日がない場合 - 「前日」、「翌日」
   * @returns {string} 算出した日付「yyyy-MM-dd」
   */
  //★★★★★★★★★★★★★★★★★★★
  function 日付変換(入力日付, 加算月数, 算出日付, 該当日がない場合) {
    const 入力日付Array = 入力日付.split('-'); //「yyyy-MM-dd」を年月日に分割
    const inputDate = new Date(入力日付Array[0], 入力日付Array[1] - 1, 入力日付Array[2]); //Dateオブジェクト作成
    inputDate.setMonth(inputDate.getMonth() + Number(加算月数)); //月数加算

    //年月日の「日」が異なる(3/31の1カ月後→5/1)
    if (inputDate.getDate() != Number(入力日付Array[2])) {
      if (該当日がない場合 == '前日') {
        inputDate.setDate(0); //1月31日の翌月が3月3日になるので、前月末に変換
      }
    }
    if (算出日付 == '月末日') {
      inputDate.setMonth(inputDate.getMonth() + 1, 0);
    } else if (算出日付 == '月初日') {
      inputDate.setMonth(inputDate.getMonth(), 1);
    }
    return inputDate.toLocaleDateString('ja-JP').replaceAll('/', '-'); //「yyyy/MM/dd」→「yyyy-MM-dd」
  }
})(kintone.$PLUGIN_ID);
