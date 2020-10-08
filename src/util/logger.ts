import { OutputChannel, window } from "vscode";
import { errorMessage } from "./message";

import { getProperty } from "./property";

const enum Level {
    Info = "info",
    Error = "error",
    Command = "command",
    Critical = "critical",
}

export class Logger {
    private static instance?: Logger;
    private readonly out: OutputChannel;

    public static getInstance(): Logger {
        if (Logger.instance === undefined) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }

    private constructor() {
        this.out = window.createOutputChannel("Extension: gitblame");
    }

    public info(message: string): void {
        this.write(Level.Info, message);
    }

    public command(message: string): void {
        this.write(Level.Command, message);
    }

    public error(error: Error): void {
        this.write(Level.Error, error.toString());
    }

    public critical(error: Error, message: string): void {
        this.write(Level.Critical, error.toString());
        void this.showErrorMessage(message);
    }

    public dispose(): void {
        Logger.instance = undefined;
        this.out.dispose();
    }

    private async showErrorMessage(message: string): Promise<void> {
        const button = "Show Log";
        const selected = await errorMessage(message, button);

        if (selected === button) {
            this.out.show();
        }
    }

    private write(level: Level, message: string): void {
        const logNonCritical = getProperty("logNonCritical");

        if (logNonCritical || level === Level.Critical) {
            const timestamp = (new Date).toTimeString().substr(0,8);
            this.out.appendLine(
                `[ ${timestamp} | ${level} ] ${message.trim()}`,
            );
        }
    }
}
