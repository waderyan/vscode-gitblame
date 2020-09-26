import "@abraham/reflection";
import { registerContainer } from "./container-registry";

registerContainer();

export { activate } from "./main";
