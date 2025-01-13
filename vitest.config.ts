/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-default-export */
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
  },
});
