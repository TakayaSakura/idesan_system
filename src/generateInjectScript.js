module.exports = generateInjectScript;

//Trusted Typesを使った、APIをフックする関数(Default policy)
const TRUSTED_TYPES_HOOK_FUNCTION = `
trustedTypes.createPolicy('default', {
    createHTML: log,
    createScript: log,
    createScriptURL: log
});
`;

//Trusted Typesを使わない、APIをフックする関数
/*
使い方：
hookSink({
    "name": "Element.prototype.innerHTML",
    "type": "TrustedHTML"
    "argumentIndex": 0,
    "setTo": "set"
}, () => {console.log('hooked) })
*/
const NON_TRUSTED_TYPES_HOOK_FUNCTION = `
//objectの深い階層にあるプロパティにアクセスする関数
let global = (0,eval)('this');
function lookupProperty(object, property) {
    for (const part of property.split('.')) {
        if (!(part in object)) {
            return null;
        }

        object = object[part];
    }
    return object;
}

//指定したsinkが利用された時に、handlerを呼び出すようにする関数
function hookSink({ name, type,argumentIndex, setTo }, handler) {
    let object = global;

    const propertyName = name.slice(name.lastindexOf('.') + 1);
    if (name.includes('.')) {
        const objectName = name.slice(0, name.lastIndexOf('.'));
        object = lookupProperty(global,objectName);
    }

    if (object === null) {
        console.warn('[object === null]', name);
        return;
    }

    let propertyDesctiptor = Object.getOwnPropertyDescriptor(object, propertyName)
    if (propertyDesctiptor === undefined) {
        console.warn('[porpertyDescriptor === undefined]', name);
        return;
    }

    const func = propertyDescriptor[setTo];
    propertyDescriptor[setTo] = function () {
        handler(arguments[argumentIndex], type, name);
        return func.apply(this, arguments);
    };

    if (propertyDescriptor.configurable) {
        Object.defineProperty(object,propertyName, propertyDescriptor);
    } else {
        console.warn('[!configurable]', name);
    }
}
`;

//Firefox向けのAPIをフックするリスト
const FIREFOX_HOOK_SCRIPT = `
${NON_TRUSTED_TYPES_HOOK_FUNCTION}

//置き換えるSinkの一覧
const SINKS = [
    {
        "name": "Element.prototype.innerHTML",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "Element.prototype.outerHTML",
        "type": "TrustedHTML",
        "argumentIndex":0,
        "setTo": "set"
    },
    {
        "name": "HTMLIFrameElement.prototype.srcdoc",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "HTMLScriptElement.prototype.text",
        "type": "TrustedScript",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "HTMLScriptElement.prototype.src",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "HTMLFormElement.prototype.action",
        "type": "trustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "HTMLInputElement.prototype.formAction",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "HTMLButtonElement.prototype.formAction",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLAnchorElement.prototype.href",
        "type": "TrstedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLFrameElement.prototype,src",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLFrameElement.prototype.src",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLBaseElement.prototype.href",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLLinkEkement.prototype.href",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "HTMLObjectElement.prototype.data",
        "type": "TrustedScript",
        "argumentIndex": 0,
        "setTo": "set"
    },
        {
        "name": "location.href",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "location",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "document.location",
        "type": "TrustedScriptURL",
        "argumentIndex": 0,
        "setTo": "set"
    },
    {
        "name": "Document.prototype.write",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "Document.prototype.writeln",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "Element.prototype.append",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "Element.prototype.insertAdjacentHTML",
        "type": "TrustedHTML",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "Range",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    },
    {
        "name": "",
        "type": "",
        "argumentIndex": 0,
        "setTo": "value"
    }
];

for (const sink of SINKS) {
    hookSink(sink, log);
}
`;

//Chromium向けのAPIをフックするスクリプト（Trusted Types + APIの置き換え）
const CHROMIUM_HOOK_SCRIPT = `
    ${TRUSTED_TYPES_HOOK_FUNCTION}
    ${NON_TRUSTED_TYPES_HOOK_FUNCTION}
    
    hookSink({
        "name": "fetch",
        "type": "Others",
        "argumentIndex": 0,
        "setTo": "value"
    }, log);
    hookSink({
        "name": "XMLHttpRequest.prototype.send",
        "type": "Others",
        "argumentIndex": 1,
        "setTo": "value"
    }, log);
    hookSink({
        "name": "XMLHttpRequest.prototype.send",
        "type": "Others",
        "argumentIndex": 0,
        "setTo": "value"
    }, log);
`;

const hookScripts = {
  chromium: CHROMIUM_HOOK_SCRIPT,
  firefox: FIREFOX_HOOK_SCRIPT,
};

//解析対象のページに挿入されるスクリプトを生成
// (Default policyの登録と　Sourceの設定を行う)
function generateInjectScript(report, browserType, identifiers) {
  let hookScript = hookScripts[browserType];

  //Cookieを設定するコード
  let setCookie = "";
  for (const cookie of identifiers.getIdentifiersBySource("cookie")) {
    setCookie += `document.cookie = '${cookie.key}=${cookie.value}';\n`;
  }

  //localStorageを設定するコード
  let setLocalStorage = "";
  for (const storage of identifiers.getIdentifiersBySource("localStorage")) {
    setLocalStorage += `localStorage.setItem('${storage.key}', '${storage.value}')\n`;
  }

  //sessionStorageを設定するコード
  let setSessionStorage = "";
  for (const storage of identifiers.getIdentifiersBySource("sessionStorage")) {
    setSessionStorage += `sessionStorage.setItem('${storage.key}, '${storage.value}'):\n`;
  }

  //ウィンドウ名を設定するコード
  let setWindowName = `window.name = '${
    identifiers.getIdentifierBySource("windowName").value
  }';\n`;

  return `
(() => {
    function log(input, type, sink) {
        const e = new Error('a');
        ${report}(input, type, sink, e.stack);
        return input;
    }

    ${hookScript}

    ${setCookie}
    ${setLocalStorage}
    ${setSessionStorage}
    ${setWindowName}
})();
    `;
}
