import {
    container,
    inject,
    singleton,
} from "tsyringe";

import { TITLE_SHOW_LOG } from "../constants";
import { Property } from "./property";
import { MessageService } from "../view/messages";
import {
    OutputChannel,
    OutputChannelFactory,
} from "../view/output-channel-factory";

enum Level {
    Info = "info",
    Error = "error",
    Command = "command",
    Critical = "critical",
}

export interface ErrorHandler {
    logInfo(message: string): void;
    logCommand(message: string): void;
    logError(error: Error): void;
    logCritical(error: Error, message: string): void;
    dispose(): void;
}

@singleton()
export class ErrorHandlerImpl implements ErrorHandler {
    readonly #outputChannel: OutputChannel;

    public constructor(
        @inject("OutputChannelFactory") channelFactory: OutputChannelFactory,
    ) {
        this.#outputChannel = channelFactory.create("Extension: gitblame");
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
        void this.showErrorMessage(message);
    }

    public dispose(): void {
        this.#outputChannel.dispose();
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

    private async showErrorMessage(message: string): Promise<void> {
        const selectedItem = await container
            .resolve<MessageService>("MessageService")
            .showError(
                message,
                TITLE_SHOW_LOG,
            );

        if (selectedItem === TITLE_SHOW_LOG) {
            this.#outputChannel.show();
        }
    }

    private writeToLog(level: Level, message: string): void {
        const logNonCritical = container.resolve<Property>("Property")
            .get("logNonCritical");

        if (logNonCritical || level === Level.Critical) {
            const trimmedMessage = message.trim();
            const timestamp = this.timestamp();
            this.#outputChannel.appendLine(
                `[ ${timestamp} | ${level} ] ${trimmedMessage}`,
            );
        }
    }
}
