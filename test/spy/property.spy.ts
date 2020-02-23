import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import { PropertiesMap, Property, PropertyImpl } from "../../src/util/property";

export function initPropertySpy(): {
    propertySpy: SinonSpy;
    setProperty: <K extends keyof PropertiesMap>(
        name: K,
        value: PropertiesMap[K],
    ) => void;
    restoreProperties: () => void;
} {
    const propertySpy = spy();
    const defaultProperties = (): PropertiesMap => ({
        "infoMessageFormat": "${commit.summary}",
        "statusBarMessageFormat": "Blame ${author.name} ( ${time.ago} )",
        "statusBarMessageNoCommit": "Not Committed Yet",
        "statusBarPositionPriority": undefined,
        "inferCommitUrl": true,
        "remoteName": "origin",
        "commitUrl": "",
        "ignoreWhitespace": false,
        "isWebPathPlural": false,
        "pluralWebPathSubstrings": [
          "bitbucket",
          "atlassian",
        ],
        "logNonCritical": true,
      });
    let properties = defaultProperties();
    const restoreProperties = (): void => {
        properties = defaultProperties();
    }
    const setProperty = <K extends keyof PropertiesMap>(
        name: K,
        value: PropertiesMap[K],
    ): void => {
        properties[name] = value;
    };

    container.register<PropertyImpl>("Property", {
        useClass: class implements Property {
            public get<K extends keyof PropertiesMap>(
                name: K,
            ): PropertiesMap[K] | undefined {
                propertySpy(name);
                return properties[name];
            }
        },
    });

    return {
        propertySpy,
        setProperty,
        restoreProperties,
    }
}

export function restoreProperty(): void {
    container.register<Property>("Property", {
        useClass: PropertyImpl,
    });
}
