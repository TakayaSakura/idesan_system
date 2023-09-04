const { getSuspiciousPaths } = require("./getSuspiciousPaths");
const { simulateAttack } = require("./simulateAttack");

module.exports = {
  analyzeTarget,
};

async function analyzeTarget(browser, browserType, opts, url, parameters) {
  //脆弱と思われるデータフローを列挙
  const paths = await getSuspiciousPaths(browser, browserType, url, parameters);

  // -- no-simulate-attackオプションが付与されていなければ攻撃シミュレーション
  let vulnerabilities = [];
  let possibleVulnerabilities = [];
  if (opts.simulateAttack) {
    vulnerabilities = [];
    for (const path of paths) {
      const isVulnerable = await simulateAttack(
        browser,
        browserType,
        url,
        path,
        opts.timeout
      );
      if (isVulnerable) {
        vulnerabilities.push(path);
      } else {
        possibleVulnerabilities.push(path);
      }
    }
  } else {
    possibleVulnerabilities = paths;
  }

  //解析結果を返す
  return { vulnerabilities, possibleVulnerabilities };
}
