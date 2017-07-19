export function walkObject(object: object, keyPath: string, defaultValue: any = undefined): any {
    const pathParts = keyPath.split('.');
    const currentStep = pathParts.shift();

    if (pathParts.length === 0) {
        return object.hasOwnProperty(currentStep) ? object[currentStep] : defaultValue;;
    }
    else if (object.hasOwnProperty(currentStep)) {
        return walkObject(object[currentStep], pathParts.join('.'), defaultValue);
    }
    else {
        return defaultValue;
    }
}
