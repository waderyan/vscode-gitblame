import { OutputChannel, window } from "vscode";

const enum Level {
    Info = "info",
    Error = "error",
    Command = "command",
}

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
        this.out = window.createOutputChannel("gitblame");
    }

    public static info(message: string): void {
        Logger.write(Level.Info, message);
    }

    public static command(message: string): void {
        Logger.write(Level.Command, message);
    }

    public static error(error: Error): void {
        Logger.write(Level.Error, error.toString());
    }

    public dispose(): void {
        Logger.instance = undefined;
        this.out.dispose();
    }

    private static write(level: Level, message: string): void {
        const timestamp = (new Date).toTimeString().substr(0,8);
        Logger.getInstance().out.appendLine(
            `[ ${timestamp} | ${level} ] ${message.trim()}`,
        );
    }
}
