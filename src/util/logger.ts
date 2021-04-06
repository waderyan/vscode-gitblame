import { OutputChannel, window } from "vscode";
import { extensionName } from "..";

export class Logger {
    private static instance?: Logger;
    private readonly out: OutputChannel;

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }

    private constructor() {
        this.out = window.createOutputChannel(extensionName);
    }

    public static info(message: string): void {
        Logger.write("info", message);
    }

    public static command(message: string): void {
        Logger.write("command", message);
    }

    public static error(error: Error): void {
        Logger.write("error", error.toString());
    }

    public dispose(): void {
        Logger.instance = undefined;
        this.out.dispose();
    }

    private static write(level: string, message: string): void {
        const timestamp = (new Date).toTimeString().substr(0,8);
        Logger.getInstance().out.appendLine(`[ ${timestamp} | ${level} ] ${message.trim()}`);
    }
}
