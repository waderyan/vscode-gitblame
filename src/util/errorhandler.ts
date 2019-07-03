import {
    OutputChannel,
    window,
} from "vscode";
import {
    container,
    singleton,
} from "tsyringe";

import { TITLE_SHOW_LOG } from "../constants";
import { Property } from "./property";

enum Level {
    Info = "info",
    Error = "error",
    Command = "command",
    Critical = "critical",
}

@singleton()
export class ErrorHandler {
    private readonly outputChannel: OutputChannel;

    public constructor() {
        this.outputChannel = window.createOutputChannel("Extension: gitblame");
    }
    public logInfo(message: string): void {
        this.writeToLog(Level.Info, message);
    }

    public logCommand(message: string): void {
        this.writeToLog(Level.Command, message);
    }

    public logError(error: Error): void {
        this.writeToLog(
            Level.Error,
            error.toString(),
        );
    }

    public logCritical(error: Error, message: string): void {
        this.writeToLog(
            Level.Critical,
            error.toString(),
        );
        this.showErrorMessage(message);
    }

    private timestamp(): string {
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

    public dispose(): void {
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

    private writeToLog(level: Level, message: string): void {
        const logNonCritical = container.resolve(Property)
            .get("logNonCritical");

        if (logNonCritical || level === Level.Critical) {
            const trimmedMessage = message.trim();
            const timestamp = this.timestamp();
            this.outputChannel.appendLine(
                `[ ${timestamp} | ${level} ] ${trimmedMessage}`,
            );
        }
    }
}
