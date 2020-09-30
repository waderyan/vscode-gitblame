import { OutputChannel, window } from "vscode";

import { getProperty } from "./property";

enum Level {
    Info = "info",
    Error = "error",
    Command = "command",
    Critical = "critical",
}

export class ErrorHandler {
    private static instance?: ErrorHandler;
    private readonly outputChannel: OutputChannel;

    public static getInstance(): ErrorHandler {
        if (ErrorHandler.instance === undefined) {
            ErrorHandler.instance = new ErrorHandler();
        }

        return ErrorHandler.instance;
    }

    private constructor() {
        this.outputChannel = window.createOutputChannel("Extension: gitblame");
    }

    public logInfo(message: string): void {
        this.writeToLog(Level.Info, message);
    }

    public logCommand(message: string): void {
        this.writeToLog(Level.Command, message);
    }

    public logError(error: Error): void {
        this.writeToLog(Level.Error, error.toString());
    }

    public logCritical(error: Error, message: string): void {
        this.writeToLog(Level.Critical, error.toString());
        void this.showErrorMessage(message);
    }

    public dispose(): void {
        ErrorHandler.instance = undefined;
        this.outputChannel.dispose();
    }

    private async showErrorMessage(message: string): Promise<void> {
        const button = "Show Log";
        const selected = await window.showErrorMessage(message, button);

        if (selected === button) {
            this.outputChannel.show();
        }
    }

    private writeToLog(level: Level, message: string): void {
        const logNonCritical = getProperty("logNonCritical");

        if (logNonCritical || level === Level.Critical) {
            const trimmedMessage = message.trim();
            const timestamp = (new Date).toTimeString().substr(0,8);
            this.outputChannel.appendLine(
                `[ ${timestamp} | ${level} ] ${trimmedMessage}`,
            );
        }
    }
}
