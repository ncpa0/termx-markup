const fs = require("fs");
const path = require("path");

const Bench = require("benchmark");
const fxp = require("fast-xml-parser");
const xml2js = require("xml2js");
const { parseMarkup } = require("../dist/cjs/index.cjs");

const FxpParser = new fxp.XMLParser({
  preserveOrder: true,
  allowBooleanAttributes: true,
  ignoreAttributes: false,
});

const microSample = fs.readFileSync(
  path.resolve(__dirname, "./samples/micro.xml"),
  "utf8"
);

const smallSample = fs.readFileSync(
  path.resolve(__dirname, "./samples/small.xml"),
  "utf8"
);

const mediumSample = fs.readFileSync(
  path.resolve(__dirname, "./samples/medium.xml"),
  "utf8"
);

const largeSample = fs.readFileSync(
  path.resolve(__dirname, "./samples/large.xml"),
  "utf8"
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runSuiteForSample = (name, sample) => {
  return new Promise((r) => {
    const suite = new Bench.Suite(
      `\u001b[1m\u001b[37mMarkup Parser benchmark, sample: \u001b[33m${name}\u001b[0m`
    );
    suite
      .add("fast-xml-parser", function () {
        FxpParser.parse(sample);
      })
      .add("xml2js", function () {
        xml2js.parseString(sample);
      })
      .add("parseMarkup", function () {
        parseMarkup(sample);
      })
      .on("start", function () {
        console.log("Running Suite: " + this.name);
      })
      .on("error", function (e) {
        console.log("Error in Suite: " + this.name, e);
      })
      .on("abort", function (e) {
        console.log("Aborting Suite: " + this.name, e);
      })
      .on("complete", function () {
        const fastest = this.filter("fastest");

        console.log("");

        for (let j = 0; j < this.length; j++) {
          console.log(
            "   ",
            this[j].toString(),
            "\u001b[94m" +
              ((this[j].hz / fastest[0].hz) * 100).toFixed(0) +
              "%\u001b[0m"
          );
        }

        console.log(
          "\n\u001b[1m\u001b[37mFastest is \u001b[92m" + fastest.map("name"),
          "\u001b[0m"
        );
        r();
      })
      // run async
      .run({ async: true });
  });
};

const separator = "\u001b[35m" + "-".repeat(65) + "\u001b[0m";

async function main() {
  console.log(separator + "\n");
  await runSuiteForSample("micro.xml", microSample);
  await sleep(2500);
  console.log("\n" + separator, "\n");
  await runSuiteForSample("small.xml", smallSample);
  await sleep(2500);
  console.log("\n" + separator, "\n");
  await runSuiteForSample("medium.xml", mediumSample);
  await sleep(2500);
  console.log("\n" + separator, "\n");
  await runSuiteForSample("large.xml", largeSample);
  console.log("\n" + separator);
}

main();
