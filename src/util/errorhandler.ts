import { OutputChannel, window } from "vscode";

import { TITLE_SHOW_LOG } from "../constants";
import { Properties, Property } from "./property";

enum LogCategory {
    Info = "info",
    Error = "error",
    Command = "command",
    Critical = "critical",
}

export class ErrorHandler {

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }

        return ErrorHandler.instance;
    }

    private static instance: ErrorHandler;

    private static timestamp(): string {
        const now = new Date();
        const hour = now
            .getHours()
            .toString()
            .padStart(2, "0");
        const minute = now
            .getMinutes()
            .toString()
            .padStart(2, "0");
        const second = now
            .getSeconds()
            .toString()
            .padStart(2, "0");

        return `${hour}:${minute}:${second}`;
    }

    private readonly outputChannel: OutputChannel;

    private constructor() {
        this.outputChannel = window.createOutputChannel("Extension: gitblame");
    }

    public logInfo(message: string) {
        this.writeToLog(LogCategory.Info, message);
    }

    public logCommand(message: string): void {
        this.writeToLog(LogCategory.Command, message);
    }

    public logError(error: Error): void {
        this.writeToLog(LogCategory.Error, error.toString());
    }

    public logCritical(error: Error, message: string): void {
        this.writeToLog(LogCategory.Critical, error.toString());
        this.showErrorMessage(message);
    }

    public dispose() {
        this.outputChannel.dispose();
    }

    private async showErrorMessage(message: string): Promise<void> {
        const selectedItem = await window.showErrorMessage(
            message,
            TITLE_SHOW_LOG,
        );

        if (selectedItem === TITLE_SHOW_LOG) {
            this.outputChannel.show();
        }
    }

    private writeToLog(category: LogCategory, message: string): boolean {
        const allowCategory = this.logCategoryAllowed(category);

        if (allowCategory) {
            const trimmedMessage = message.trim();
            const timestamp = ErrorHandler.timestamp();
            this.outputChannel.appendLine(
                `[ ${timestamp} | ${category} ] ${trimmedMessage}`,
            );
        }

        return allowCategory;
    }

    private logCategoryAllowed(level: LogCategory): boolean {
        const enabledLevels = Property.get(Properties.LogLevel, []) as string[];

        return enabledLevels.includes(level);
    }
}
