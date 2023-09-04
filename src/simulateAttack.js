const util = require("./util");
const { fireEvents } = require("./fireEvents");

module.exports = {
  simulateAttack,
};

//Sinkの種類に応じてペイロードを生成
function generatePayload(uniqueString, { source, type }) {
  const payload = `alert('${uniqueString}')`;

  //eval等
  if (type === "TrustedScript") {
    return `javascript:${payload}`;
  }

  //innerHTML等
  if (type === "TrustedHTML") {
    return `<img src="xxx" onerror="${payload}">`;
  }

  //scriptのsrc等
  if (type === "TrustedScriptURL") {
    return `data:,${payload}`;
  }

  return "";
}

//攻撃対象のページに挿入されるスクリプトを生成
//（Sourceにペイロードを仕込む）
function generateAttackScript(payload, { source }) {
  let result = "";

  if (source.name === "cookie") {
    result += `document.cookie = \`${source.key}=${payload}\``;
  }

  if (source.name === `localStorage`) {
    result += `localStorage.setItem('${source.key}', \`${payload}\`)`;
  }

  if (source.name === "sessionStorage") {
    result += `sessionStorage.setItem('${source.key}', \`${payload}\`)`;
  }

  if (source.name === "windowName") {
    result += `window.name = \`${payload}\``;
  }

  return result;
}

//攻撃シミュレーションを行う
async function simulateAttack(browser, browserType, url, path, timeout) {
  const { source } = path;

  //alert関数を呼び出すスクリプトをペイロードとする
  //alert関数が攻撃によって呼び出された場合と、
  //正常な動作で呼び出された倍位を判別するため、
  //引数に特定のランダムな文字列が含まれるようなペイロードを生成する
  const uniqueString = util.generateRandomString();
  const payload = generatePayload(uniqueString, path);
  const script = generateAttackScript(payload, path);

  const page = await browser.newPage();
  await page.addInitScript(script);

  //GETパラメータとフラグメント識別子にもペイロードを仕込む
  let browsingUrl = url;
  if (source.name === "getParameter") {
    browsingUrl += `?${source.key}=${encodeURI(payload)}`;
  }
  if (source.name === "hash") {
    browsingUrl += `#${encodeURI(payload)}`;
  }

  //alert関数が呼び出された場合の処理、引数が特定の文字列でなければスルー
  let isVulnerable = false;
  page.on("dialog", async (dialog) => {
    const message = dialog.message();

    if (message === uniqueString) {
      isVulnerable = true;
    }

    await dialog.accept();
  });

  const refererValue = "http://example.com/?" + payload;

  await page
    .goto(browsingUrl, {
      timeout,
      waitUntil: "networkidle0",
      referer: source.name === "referer" ? refererValue : "",
    })
    .catch(() => "error");

  //イベントの強制発火
  if (browserType === "chromium") {
    await fireEvents(page);
  }

  await page.close();

  return isVulnerable;
}
