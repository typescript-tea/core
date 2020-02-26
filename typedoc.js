module.exports = {
  inputFiles: [
    "src/cmd.ts",
    "src/dispatch.ts",
    "src/effect-manager.ts",
    "src/program.ts",
    "src/result.ts",
    "src/runtime.ts",
    "src/sub.ts",
  ],
  out: "docs",
  // mode: "library",
  excludeExternals: true,
  excludeNotExported: true,
  externalPattern: ["**/__tests__/**", "**/__examples__/**", "**/index.ts"],
  // theme: "minimal",
  // This seems not to work, it just turns catetory off?
  categorizeByGroup: false,
};
