/** @type {import("jest").Config} */
module.exports = {
  testRegex: ".*__tests__/.+(.test.(ts|js|tsx|jsx))$",
  transform: {
    "^.+.(js|jsx|ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          keepClassNames: true,
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: false,
          },
          target: "es2020",
          baseUrl: ".",
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
        module: {
          type: "es6",
          strict: true,
        },
      },
    ],
  },
  roots: ["<rootDir>"],
  collectCoverageFrom: ["src/**/*.(ts|js|tsx|jsx)"],
  coverageReporters: ["html", "text"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/__setup/jest-setup.js"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/__mocks__/",
    "/__tests__/",
    "/dist/",
    "/.husky/",
    "/.vscode/",
  ],
};
