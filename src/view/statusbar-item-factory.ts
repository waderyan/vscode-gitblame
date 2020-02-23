import { StatusBarAlignment, StatusBarItem, window } from "vscode";

export interface StatusBarItemFactory {
    createStatusBarItem(
        alignment: StatusBarAlignment,
        priority?: number,
    ): StatusBarItem;
}

export class StatusBarItemFactoryImpl implements StatusBarItemFactory {
    public createStatusBarItem(
        alignment: StatusBarAlignment,
        priority?: number,
    ): StatusBarItem {
        return window.createStatusBarItem(alignment, priority);
    }
}
