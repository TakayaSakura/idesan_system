const crypto = require("crypto");

module.exports = {
  generateRandomString,
  parseCallStack,
};

function generateRandomString() {
  const bytes = crypto.randomBytes(32);
  return bytes.toString("hex");
}

function parseChromeCallStack(error) {
  const stack = error.split("\n").slice(1);

  const parsedStack = stack.map((e) => {
    //トップレベルの呼び出しであれば、at test.html:11:9　のようになる（関数名がない）
    //そうでなければ at g (test.html:11:9)　のようになるので、カッコの有無でトップレベルの呼び出しか判断
    const functionName = e.includes(" (") ? e.match(/at (.+?) \(/)[1] : null;

    let fileName, lineNumber, columnNumber;
    if (functionName === "eval") {
      //evalからの呼び出しであれば、ファイル名は<anonmymous>ということにする
      [fileName, lineNumber, columnNumber] = ["<anonymous>", 1, 1];
    } else {
      //トップレベルの呼び出しであれば、ファイル名などはカッコでなくatの直後に来る
      [fileName, lineNumber, columnNumber] = e.includes("(")
        ? e.match(/\(([^(]+):(\d+):(\d+)\)$/).slice(1)
        : e.match(/at (.+):(\d+):(\d+)$/).slice(1);
    }

    lineNumber = parseInt(lineNumber, 10);
    columnNumber = parseInt(columnNumber, 10);

    return {
      functionName,
      fileName,
      lineNumber,
      columnNumber,
    };
  });

  return parsedStack;
}

function parseFirefoxCallStack(error) {
  const stack = error.trimEnd().split("\n");

  const parsedStack = stack.map((e) => {
    //f@http://のように、各行の先頭に関数名が来る
    //トップレベルの呼び出しであれば、@http://...のようになる（関数名がない）
    let [functionName, callLocation] = e.split("@");
    functionName = functionName.length > 0 ? functionName : null;

    //ファイル名、行番号、列番号は a.js:13:9 のようにコロン区切りで与えられる
    //ファイル名には http://localhost:8000 のようにコロンが含まれる可能性もあるから、右側から区切る
    let [fileName, lineNumber, columnNumber] = callLocation
      .match(/(.+):(.+):(.+)$/)
      .slice(1);
    lineNumber = parseInt(lineNumber, 10);
    columnNumber = parseInt(columnNumber, 10);

    return {
      functionName,
      fileName,
      lineNumber,
      columnNumber,
    };
  });

  return parsedStack;
}

function parseCallStack(error, browser = "chromium") {
  if (browser === "chrome" || browser === "chromium") {
    return parseChromeCallStack(error);
  }

  if (browser === "firefox") {
    return parseFirefoxCallStack(error);
  }

  throw new Error("unimplemented browser");
}
