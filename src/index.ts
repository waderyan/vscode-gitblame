import "reflect-metadata";

import { container, Lifecycle } from "tsyringe";

import { ActiveTextEditorImpl } from "./vscode-api/active-text-editor";
import { ClipboardImpl } from "./vscode-api/clipboard";
import { CommandImpl } from "./vscode-api/command";
import { EditorEventsImpl } from "./vscode-api/editor-events";
import { ExtensionGetterImpl } from "./vscode-api/get-extension";
import { WorkspaceImpl } from "./vscode-api/workspace";
import { ActionableMessageItemImpl } from "./util/actionable-message-item";
import { ErrorHandlerImpl } from "./util/errorhandler";
import { ExecutorImpl } from "./util/execcommand";
import { PropertyImpl } from "./util/property";
import { MessageServiceImpl } from "./view/messages";
import { OutputChannelFactoryImpl } from "./view/output-channel-factory";
import { StatusBarItemFactoryImpl } from "./view/statusbar-item-factory";
import { StatusBarViewImpl } from "./view/view";
import { GitBlameImpl } from "./git/blame";
import { GitExtensionImpl } from "./git/extension";
import { GitFileFactoryImpl } from "./git/filefactory";
import { GitBlameStreamImpl } from "./git/stream";

export function registerContainer(): void {
    const uc = <T>(useClass: T): {useClass: T} => ({useClass});
    const singleton = {lifecycle: Lifecycle.Singleton};

    // vscode-api
    container.register("ActiveTextEditor", uc(ActiveTextEditorImpl));
    container.register("Clipboard", uc(ClipboardImpl));
    container.register("Command", uc(CommandImpl));
    container.register("EditorEvents", uc(EditorEventsImpl));
    container.register("ExtensionGetter", uc(ExtensionGetterImpl));
    container.register("Workspace", uc(WorkspaceImpl));

    // util
    container.register("ActionableMessageItem", uc(ActionableMessageItemImpl));
    container.register("ErrorHandler", uc(ErrorHandlerImpl), singleton);
    container.register("Executor", uc(ExecutorImpl));
    container.register("Property", uc(PropertyImpl));

    // view
    container.register("MessageService", uc(MessageServiceImpl));
    container.register("OutputChannelFactory", uc(OutputChannelFactoryImpl));
    container.register("StatusBarItemFactory", uc(StatusBarItemFactoryImpl));
    container.register("StatusBarView", uc(StatusBarViewImpl), singleton);

    // git
    container.register("GitBlame", uc(GitBlameImpl));
    container.register("GitExtension", uc(GitExtensionImpl), singleton);
    container.register("GitFileFactory", uc(GitFileFactoryImpl));
    container.register("GitBlameStream", uc(GitBlameStreamImpl));
}

registerContainer();

export { activate } from "./main";
