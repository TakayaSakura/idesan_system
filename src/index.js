const chalk = require("chalk");
const fs = require("fs");
const playwright = require("playwright");
const { Command } = require("commander");
const { analyzeTarget } = require("./analyzeTarget");
const { printPaths } = require("./printResults");

const BROWSERS = ["chromium"];

//メイン処理
const main = async () => {
  //コマンドライン引数とか
  const program = new Command();
  program.version("0.0.1");
  program
    .option("-f, --file <filename>", "give URL list as JSON")
    .option("-t, --timeout <milliseconds>", "set browsing timeout", "3000")
    .option("-r, --result-format <style>", "set result format", "verbose")
    .option(
      "-c, --cookie <cookie name>",
      "set cookie name to be injected",
      "test"
    )
    .option(
      "-l, --localstorage <localStorage key>",
      "set localStorage key to be injected",
      "test"
    )
    .option(
      "-s, --sessionstorage <sessionStorage key>",
      "set sessionStorage key to be injured",
      "test"
    )
    .option(
      "-g, --getparameter <get parameter>",
      "set GET parameter to be injected",
      "test"
    )
    .option("--no-simulate-attack", "Only shows suspicious data flows", false);
  program.parse(process.argv);

  const opts = program.opts();
  if (!opts.file && program.args.length === 0) {
    program.help();
  }

  //-fオプションがあればJSONファイルを読み込む
  //そうでなければコマンドライン引数からURLを得る
  let targets;
  if (opts.file) {
    const data = fs.readFileSync(opts.file);
    targets = JSON.parse(data);
  } else {
    targets = program.args;
  }

  //ブラウザやペイロードに関する各種オプション
  opts.timeout = parseInt(opts.timeout, 10);
  const parameters = {
    cookieKey: opts.cookie.split(","),
    localStorageKey: opts.localstorage.split(","),
    sessionStorageKey: opts.sessionstorage.split(","),
    getParameter: opts.getparameter.split(","),
  };

  //各ブラウザの立ち上げ
  let browsers = {};
  for (const browserType of BROWSERS) {
    browsers[browserType] = await playwright[browserType].launch({
      headless: true,
      args: ["--no-sandbox"],
    });
  }

  //与えられたURLそれぞれに解析と攻撃
  for (const url of targets) {
    let foundVulnerability = false;
    let foundPossibleVulnerability = false;

    if (opts.resultFormat === "verbose") {
      process.stdout.write(`[*] Target: ${url}\n`);
    }

    for (const browserType of BROWSERS) {
      if (opts.resultFormat === "verbose") {
        process.stdout.write(`[*] Browser: ${browserType}\n`);
      }

      const { vulnerabilities, possibleVulnerabilities } = await analyzeTarget(
        browsers[browserType],
        browserType,
        opts,
        url,
        parameters
      );

      if (vulnerabilities.length > 0) {
        foundVulnerability = true;
        foundPossibleVulnerability = true;
      } else if (possibleVulnerabilities.length > 0) {
        foundPossibleVulnerability = true;
      }
    }

    if (opts.resultFormat === "verbose") {
      process.stdout.write(`==========\n`);
    }

    if (opts.resultFormat === "simple") {
      process.stdout.write(
        foundPossibleVulnerability ? chalk.red("Y") : chalk.green("N")
      );
      process.stdout.write(
        foundVulnerability ? chalk.red("Y") : chalk.green("N")
      );
      process.stdout.write(`\t${url}\n`);
    }
  }

  //各ブラウザを終了させる
  for (const browserType of BROWSERS) {
    await browsers[browserType].close();
  }
};

main();
