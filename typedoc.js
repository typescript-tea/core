module.exports = {
  out: "docs",
  // mode: "library",
  // mode: "modules",
  excludeExternals: true,
  excludeNotExported: true,
  externalPattern: ["**/__tests__/**", "**/__examples__/**", "**/index.ts"],
  categorizeByGroup: false,
  categoryOrder: ["Commands", "Subscriptions", "Dispatch", "Fancy Stuff", "*"],
};
