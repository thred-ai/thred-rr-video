#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const minimist_1 = __importDefault(require("minimist"));
const cli_progress_bar_1 = require("@open-tech-world/cli-progress-bar");
const index_1 = require("./index");
const argv = (0, minimist_1.default)(process.argv.slice(2));
if (!argv.input) {
    throw new Error('please pass --input to your rrweb events file');
}
let config = {};
if (argv.config) {
    const configPathStr = argv.config;
    const configPath = path.isAbsolute(configPathStr)
        ? configPathStr
        : path.resolve(process.cwd(), configPathStr);
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
const pBar = new cli_progress_bar_1.ProgressBar({ prefix: 'Transforming' });
const onProgressUpdate = (percent) => {
    if (percent < 1)
        pBar.run({ value: percent * 100, total: 100 });
    else
        pBar.run({ value: 100, total: 100, prefix: 'Transformation Completed!' });
};
(0, index_1.transformToVideo)({
    input: argv.input,
    output: argv.output,
    rrwebPlayer: config,
    onProgressUpdate,
})
    .then((file) => {
    console.log(`Successfully transformed into "${file}".`);
})
    .catch((error) => {
    console.log('Failed to transform this session.');
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map