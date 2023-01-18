const { build } = require("@ncpa0cpl/nodepack");
const path = require("path");

const p = (filePath) => path.resolve(__dirname, "..", filePath);

async function main() {
  try {
    await build({
      srcDir: p("src"),
      outDir: p("dist"),
      tsConfig: p("tsconfig.json"),
      target: "ESNext",
      formats: ["cjs", "esm", "legacy"],
      declarations: true,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
