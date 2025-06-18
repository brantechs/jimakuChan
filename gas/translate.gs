function doGet(e) {
  const params = e.parameter;

  // LockServiceを取得
  var lock = LockService.getUserLock();

  // ロックを試みる（タイムアウトは10秒）
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    // ロック取得に失敗した場合の処理
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Request timeout. Please try again.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // プロパティサービスを使用して、翻訳のタイムスタンプを取得
    var userProperties = PropertiesService.getUserProperties();
    var timestamps = JSON.parse(userProperties.getProperty('timestamps') || '[]');

    // 現在の日時を取得
    var now = new Date();

    // 24時間以上前のタイムスタンプを削除
    timestamps = timestamps.filter(function(timestamp) {
      return now - new Date(timestamp) < 24 * 60 * 60 * 1000;
    });

    // 翻訳を実行し、タイムスタンプを追加
    var translatedText = LanguageApp.translate(params.text, params.source, params.target);
    timestamps.push(now.toISOString());

    // タイムスタンプを保存
    userProperties.setProperty('timestamps', JSON.stringify(timestamps));
  } finally {
    // ロック解除
    lock.releaseLock();
  }

  // JSON出力を作成
  const output = ContentService.createTextOutput();
  var result = {
    translatedText: translatedText,
    translatedCount: timestamps.length // 翻訳回数
  };
  return output.setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(result));
}
