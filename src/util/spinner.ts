import { workspace } from 'vscode';


export class Spinner {
    private state: number = 0;

    private nextState(possibleStates: string[]): void {
        let newStateValue = this.state + 1;
        if (newStateValue >= possibleStates.length) {
            newStateValue = 0;
        }

        this.state = newStateValue;
    }

    private getStates(): string[] {
        const properties = workspace.getConfiguration('gitblame');
        return <string[]>properties.get('progressSpinner');
    }

    updatable(): boolean {
        return this.getStates().length > 1;
    }

    toString(): string {
        const states = this.getStates();

        this.nextState(states);

        return states[this.state];
    }
}
