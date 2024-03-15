import type { RRwebPlayerOptions } from 'rrweb-player';
type RRvideoConfig = {
    input: string;
    output?: string;
    headless?: boolean;
    resolutionRatio?: number;
    onProgressUpdate?: (percent: number) => void;
    rrwebPlayer?: Omit<RRwebPlayerOptions['props'], 'events'>;
};
export declare function transformToVideo(options: RRvideoConfig): Promise<string>;
export {};
