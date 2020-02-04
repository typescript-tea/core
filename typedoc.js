module.exports = {
  inputFiles: ["./src/http.ts", "./src/result.ts"],
  out: "docs",
  excludeExternals: true,
  excludeNotExported: true,
  externalPattern: ["**/__tests__/**", "**/__examples__/**", "**/index.ts"],
  // theme: "minimal",
  // This seems not to work, it just turns catetory off?
  categorizeByGroup: false
};
