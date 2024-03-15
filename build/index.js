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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformToVideo = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const playwright_1 = require("playwright");
const types_1 = require("@rrweb/types");
const rrwebScriptPath = path.resolve(require.resolve('rrweb-player'), '../../dist/index.js');
const rrwebStylePath = path.resolve(rrwebScriptPath, '../style.css');
const rrwebRaw = fs.readFileSync(rrwebScriptPath, 'utf-8');
const rrwebStyle = fs.readFileSync(rrwebStylePath, 'utf-8');
// The max valid scale value for the scaling method which can improve the video quality.
const MaxScaleValue = 2.5;
const defaultConfig = {
    input: '',
    output: 'rrvideo-output.webm',
    headless: true,
    // A good trade-off value between quality and file size.
    resolutionRatio: 1,
    onProgressUpdate: () => {
        //
    },
    rrwebPlayer: {},
};
function getHtml(events, config) {
    var _a;
    return `
<html>
  <head>
  <style>${rrwebStyle}</style>
  <style>html, body {padding: 0; border: none; margin: 0;}</style>
  </head>
  <body>
    <script>
      ${rrwebRaw};
      /*<!--*/
      const events = ${JSON.stringify(events).replace(/<\/script>/g, '<\\/script>')};
      /*-->*/
      const userConfig = ${JSON.stringify((config === null || config === void 0 ? void 0 : config.rrwebPlayer) || {})};
      window.replayer = new rrwebPlayer({
        target: document.body,
        width: userConfig.width,
        height: userConfig.height,
        props: {
          ...userConfig,
          events,
          showController: false,          
        },
      });
      window.replayer.addEventListener('finish', () => window.onReplayFinish());
      window.replayer.addEventListener('ui-update-progress', (payload)=> window.onReplayProgressUpdate
      (payload));
      window.replayer.addEventListener('resize',()=>document.querySelector('.replayer-wrapper').style.transform = 'scale(${((_a = config === null || config === void 0 ? void 0 : config.resolutionRatio) !== null && _a !== void 0 ? _a : 1) * MaxScaleValue}) translate(-50%, -50%)');
    </script>
  </body>
</html>
`;
}
/**
 * Preprocess all events to get a maximum view port size.
 */
function getMaxViewport(events) {
    let maxWidth = 0, maxHeight = 0;
    events.forEach((event) => {
        if (event.type !== types_1.EventType.Meta)
            return;
        if (event.data.width > maxWidth)
            maxWidth = event.data.width;
        if (event.data.height > maxHeight)
            maxHeight = event.data.height;
    });
    return {
        width: maxWidth,
        height: maxHeight,
    };
}
function transformToVideo(options) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const defaultVideoDir = '__rrvideo__temp__';
        const config = Object.assign({}, defaultConfig);
        if (!options.input)
            throw new Error('input is required');
        // If the output is not specified or undefined, use the default value.
        if (!options.output)
            delete options.output;
        Object.assign(config, options);
        if (config.resolutionRatio > 1)
            config.resolutionRatio = 1; // The max value is 1.
        const eventsPath = path.isAbsolute(config.input)
            ? config.input
            : path.resolve(process.cwd(), config.input);
        const outputPath = path.isAbsolute(config.output)
            ? config.output
            : path.resolve(process.cwd(), config.output);
        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
        // Make the browser viewport fit the player size.
        const maxViewport = getMaxViewport(events);
        // Use the scaling method to improve the video quality.
        const scaledViewport = {
            width: Math.round(maxViewport.width * ((_a = config.resolutionRatio) !== null && _a !== void 0 ? _a : 1) * MaxScaleValue),
            height: Math.round(maxViewport.height * ((_b = config.resolutionRatio) !== null && _b !== void 0 ? _b : 1) * MaxScaleValue),
        };
        Object.assign(config.rrwebPlayer, scaledViewport);
        const browser = yield playwright_1.chromium.launch({
            headless: config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = yield browser.newContext({
            viewport: scaledViewport,
            recordVideo: {
                dir: defaultVideoDir,
                size: scaledViewport,
            },
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36 WAIT_UNTIL=load"
        });
        const page = yield context.newPage();
        yield page.goto('about:blank');
        yield page.exposeFunction('onReplayProgressUpdate', (data) => {
            config.onProgressUpdate(data.payload);
        });
        // Wait for the replay to finish
        yield new Promise((resolve) => void page
            .exposeFunction('onReplayFinish', () => resolve())
            .then(() => page.setContent(getHtml(events, config))));
        const videoPath = (yield ((_c = page.video()) === null || _c === void 0 ? void 0 : _c.path())) || '';
        const cleanFiles = (videoPath) => __awaiter(this, void 0, void 0, function* () {
            yield fs.remove(videoPath);
            if ((yield fs.readdir(defaultVideoDir)).length === 0) {
                yield fs.remove(defaultVideoDir);
            }
        });
        yield context.close();
        yield Promise.all([
            fs
                .move(videoPath, outputPath, { overwrite: true })
                .catch((e) => {
                console.error("Can't create video file. Please check the output path.", e);
            })
                .finally(() => void cleanFiles(videoPath)),
            browser.close(),
        ]);
        return outputPath;
    });
}
exports.transformToVideo = transformToVideo;
//# sourceMappingURL=index.js.map