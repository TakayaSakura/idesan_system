const chalk = require("chalk");

module.exports = {
  printPaths,
};

function printPath(path, browserType) {
  const { source, sink, type, stackTrace } = path;

  if (source.key === null) {
    process.stdout.write(`  Path\t${source.name} \u2192 ${sink}\n`);
  } else {
    process.stdout.write(
      `  Path\t${source.name} ${source.key} \u2192 ${sink}\n`
    );
  }

  //APIフックの実装の差から、FirefoxではChromiumよりコールスタックが深くなる
  if (
    (browserType === "chromium" && stackTrace.length > 1) ||
    stackTrace.length > 2
  ) {
    const sinkLocation =
      browserType === "chromium" ? stackTrace[1] : stackTrace[2];
    const { lineNumber, columnNumber } = sinkLocation;

    let filePath;

    try {
      const url = new URL(sinkLocation.fileName);
      filePath = url.origin + url.pathname;
    } catch (e) {
      filePath = sinkLocation.fileName;
    }

    process.stdout.write(
      `  Location\t${filePath}:${lineNumber}:${columnNumber}\n`
    );
  }

  process.stdout.write("\n");
}

//解析結果をいい感じに出力
function printPaths(vulnerabilities, possibleVulnerabilities, browserType) {
  if (vulnerabilities.length === 0) {
    process.stdout.write(`  [+] ${chalk.green("0")} vulnerabilities found\n`);
  } else {
    process.stdout.write(
      `  [+] ${chalk.red(vulnerabilities.length)} vulnerabilit${
        vulnerabilities.length === 1 ? "y" : "ies"
      } found\n`
    );

    for (const path of vulnerabilities) {
      printPath(path, browserType);
    }
  }

  if (possibleVulnerabilities.length === 0) {
    process.stdout.write(
      `  [+] ${chalk.green("0")} possible vulnerabilities found\n`
    );
  } else {
    process.stdout.write(
      `  [+] ${chalk.yellow(
        possibleVulnerabilities.length
      )} possible vulnerabilit${
        possibleVulnerabilities.length === 1 ? "y" : "ies"
      } found\n`
    );

    for (const path of possibleVulnerabilities) {
      printPath(path, browserType);
    }
  }
}
