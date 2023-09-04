const { generateRandomString } = require("./util");

module.exports = {
  fireEvents,
};

async function fireEvents(page) {
  const client = await page.context().newCDPSession(page);

  //解析対象のWebページ上に存在する要素の一覧を取得
  const varName = `window.x${generateRandomString()}`;
  const object = await client.send("Runtime.evaluate", {
    expression: `${varName} = document.querySelectorAll("*")`,
  });
  const elements = await client.send("Runtime.getProperties", {
    objectId: object.result.objectId,
    ownProperties: true,
  });

  for (const element of elements.result) {
    //要素に登録されているイベントリスナの情報を取得
    const { listeners } = await client.send("DOMDebugger.getEventListeners", {
      objectId: element.value.objectId,
    });

    //取得できた情報から、全てのイベントを発火
    for (const { type } of listeners) {
      await client.send("Runtime.evaluate", {
        expression: `
                (() => {
                    const event = new Event('${type}');
                    ${varName}[${element.name}].dispatchEvent(event);
                })();
                `,
      });
    }
  }
}
