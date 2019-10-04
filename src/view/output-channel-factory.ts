import { OutputChannel as VSCodeOutputChannel, window } from "vscode";

export type OutputChannel = Pick<
VSCodeOutputChannel,
"appendLine" | "dispose" | "show"
>;

export interface OutputChannelFactory {
    create(name: string): OutputChannel;
}

export class OutputChannelFactoryImpl implements OutputChannelFactory {
    public create(name: string): OutputChannel {
        return window.createOutputChannel(name);
    }
}
