const fs = require("fs");
const path = require("path");

const Bench = require("benchmark");
const fxp = require("fast-xml-parser");
const { parseXml } = require("../dist/cjs/index.cjs");

const FxpParser = new fxp.XMLParser({
  preserveOrder: true,
  allowBooleanAttributes: true,
  ignoreAttributes: false,
});

const suite = new Bench.Suite("XML Parser benchmark");

const sample = fs.readFileSync(
  path.resolve(__dirname, "./samples/small.xml"),
  "utf8"
);

suite
  .add("fast-xml-parser", function () {
    FxpParser.parse(sample);
  })
  .add("parseXml", function () {
    parseXml(sample);
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
    console.log("\nFastest is " + fastest.map("name"), "\n");

    for (let j = 0; j < this.length; j++) {
      console.log(
        this[j].toString(),
        ((this[j].hz / fastest[0].hz) * 100).toFixed(0) + "%"
      );
    }

    console.log("");
  })
  // run async
  .run({ async: true });
