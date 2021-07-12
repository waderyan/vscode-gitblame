import { OutputChannel, window } from "vscode";

export class Logger {
    private static instance?: Logger;
    private readonly out: OutputChannel;

    public static getInstance(): Logger {
        Logger.instance = Logger.instance ?? new Logger()
        return Logger.instance;
    }

    private constructor() {
        this.out = window.createOutputChannel("Git Blame");
    }

    public static error(error: Error): void {
        Logger.write("error", error.toString());
    }

    public static write(level: string, message: string): void {
        Logger.getInstance().out.appendLine(
            `[ ${(new Date).toTimeString().substr(0, 8)} | ${level} ] ${message.trim()}`,
        );
    }

    public dispose(): void {
        Logger.instance = undefined;
        this.out.dispose();
    }
}
