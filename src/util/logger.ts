import { OutputChannel, window } from "vscode";
import { extensionName } from "../extension-name";

export class Logger {
    private static instance?: Logger;
    private readonly out: OutputChannel;

    public static getInstance(): Logger {
        return Logger.instance = Logger.instance ?? new Logger();
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
        Logger.getInstance().out.appendLine(
            `[ ${(new Date).toTimeString().substr(0, 8)} | ${level} ] ${message.trim()}`,
        );
    }
}
