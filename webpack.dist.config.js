// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const path = require("path");

module.exports = {
  mode: "production",
  entry: "./lib/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "umd.js",
    library: "TypescriptTeaReactCore",
    libraryTarget: "umd"
  }
};
