const { generateRandomString, parseCallStack } = require("./util");
const { fireEvents } = require("./fireEvents");
const generateInjectScript = require("./generateInjectScript");
const axios = require("axios");

module.exports = {
  getSuspiciousPaths,
};

//HTTPレスポンスヘッダを改変し、CSPヘッダを書き換える
async function modifyResponse(route, request) {
  const url = request.url();
  const requestHeaders = request.headers();

  let response;
  try {
    response = await axios({
      responseType: "arraybuffer",
      method: request.method(),
      url,
      headers: requestHeaders,
      body: request.postData(),
    });
  } catch (e) {
    route.abort();
    return;
  }

  const responseBody = response.data;
  let responseHeaders = response.headers;
  responseHeaders["content-security-policy"] =
    "require-trusted-types-for 'script'";

  route.fulfill({
    status: response.status,
    headers: responseHeaders,
    body: responseBody,
  });
}

class Identifiers {
  constructor() {
    this.identifiers = [];
  }

  add(source, key = null) {
    this.identifiers.push({ source, key, value: generateRandomString() });
  }

  getIdentifiersBySource(source) {
    return this.identifiers.filter((id) => id.source === source);
  }

  getIdentifierBySource(source) {
    return this.getIdentifiersBySource(source)[0];
  }

  getAllIdentifiers() {
    return this.identifiers;
  }
}

//脆弱と思われるデータフローを列挙
async function getSuspiciousPaths(browser, browserType, url, options) {
  //Sinkに与えられたユーザ入力からSourceを特定できるよう、
  //それぞれにランダムな文字列を割り当てる
  let identifiers = new Identifiers();

  options.cookieKey.forEach((key) => identifiers.add("cookie", key));
  options.localStorageKey.forEach((key) =>
    identifiers.add("localStorage", key)
  );
  options.sessionStorageKey.forEach((key) =>
    identifiers.add("sessionsStorage", key)
  );
  identifiers.add("windowName");
  identifiers.add("referer");
  identifiers.add("hash");
  options.getParameter.forEach((key) => identifiers.add("getParameter", key));

  let result = [];
  const page = await browser.newPage();

  //HTTPリクエストをフックし、CSPヘッダを書き換える
  await page.route("**/*", modifyResponse);

  let visited = new Set();

  //Sinkへのアクセスがあった際にWebブラウザから呼び出される関数を登録
  const reportFunction = "report" + generateRandomString();
  await page.exposeFunction(reportFunction, (input, type, sink, stackTrace) => {
    // 各Sourceに割り当てられた文字列が、
    // Sinkに渡ったパラメータに含まれていないかどうかで、
    // SourceからSinkへのデータフローがないか判定する
    for (const identifier of identifiers.getAllIdentifiers()) {
      const parsedStackTrace = parseCallStack(stackTrace, browserType);

      const path = {
        source: Object.assign({}, identifier, { name: identifier.source }),
        type,
        sink,
        stackTrace: parsedStackTrace,
      };

      //すでにチェックしたデータフローであればスキップ
      const jsonPath = JSON.stringify(path);
      if (visited.has(jsonPath)) {
        break;
      }
      visited.add(jsonPath);

      if (input.includes(identifier.value)) {
        result.push(path);
      }
    }
  });

  //解析対象のWebページが読み込まれた際にDefault policyとSourceの設定を行うスクリプトを仕込む
  const script = generateInjectScript(
    reportFunction,
    browser.Type,
    identifiers
  );
  await page.addInitScript(script);

  //GETパラメータとフラグメント識別子もそれぞれ割り当てられた文字列を仕込む
  let browsingUrl = url;

  let queryParameters = identifiers.getIdentifiersBySource("getParameter");
  queryParameters = queryParameters
    .map((param) => "${param.key}=javascript:${param.value}")
    .join("&");

  browsingUrl += "?" + queryParameters;
  browsingUrl += `#javascript:${
    identifiers.getIdentifierBySource("hash").value
  }`;

  //リファラにも仕込んでおく
  const { origin } = new URL(url);
  const refererValue = `${origin}?test=${
    identifiers.getIdentifierBySource("referer").value
  }`;

  //準備が整ったのでWebブラウザに対象となるWebページにアクセスさせる
  await page
    .goto(browsingUrl, {
      timeout: options.timeout,
      waitUntil: "networkidle0",
      referer: refererValue,
    })
    .catch(() => "error");
  //イベントの強制発火
  if (browserType === "chromium") {
    await fireEvents(page);
  }

  await page.close();

  return result;
}
