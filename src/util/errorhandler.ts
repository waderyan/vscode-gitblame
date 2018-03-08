import { window, OutputChannel } from 'vscode';

import { Property, Properties } from './property';
import { TITLE_SHOW_LOG } from '../constants';

enum LogCategory {
    Info = 'info',
    Error = 'error',
    Command = 'command',
    Critical = 'critical'
}

export class ErrorHandler {
    private static instance: ErrorHandler;

    private outputChannel: OutputChannel;

    private constructor() {
        this.outputChannel = window.createOutputChannel('Extension: gitblame');
    }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }

        return ErrorHandler.instance;
    }

    logInfo(message: string) {
        this.writeToLog(LogCategory.Info, message);
    }

    logCommand(message: string): void {
        this.writeToLog(LogCategory.Command, message);
    }

    logError(error: Error): void {
        this.writeToLog(LogCategory.Error, error.toString());
    }

    logCritical(error: Error, message: string): void {
        this.writeToLog(LogCategory.Critical, error.toString());
        this.showErrorMessage(message);
    }

    private async showErrorMessage(message: string): Promise<void> {
        const selectedItem = await window.showErrorMessage(
            message,
            TITLE_SHOW_LOG
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
                `[ ${timestamp} | ${category} ] ${trimmedMessage}`
            );
        }

        return allowCategory;
    }

    private logCategoryAllowed(level: LogCategory): boolean {
        const enabledLevels = <string[]>Property.get(Properties.LogLevel, []);

        return enabledLevels.includes(level);
    }

    private static timestamp(): string {
        const now = new Date();
        const hour = now
            .getHours()
            .toString()
            .padStart(2, '0');
        const minute = now
            .getMinutes()
            .toString()
            .padStart(2, '0');
        const second = now
            .getSeconds()
            .toString()
            .padStart(2, '0');

        return `${hour}:${minute}:${second}`;
    }

    dispose() {
        this.outputChannel.dispose();
    }
}
