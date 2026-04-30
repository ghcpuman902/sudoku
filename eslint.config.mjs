import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const coreWebVitalsConfig = require("eslint-config-next/core-web-vitals");
const typescriptConfig = require("eslint-config-next/typescript");

const eslintConfig = [...coreWebVitalsConfig, ...typescriptConfig];

export default eslintConfig;
