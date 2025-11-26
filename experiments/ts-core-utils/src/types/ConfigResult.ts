import { ConfigurationItem } from "./configurationItem.js";

export type ConfigResult<T extends Record<string, ConfigurationItem<any>>> = {
    [K in keyof T]: T[K] extends ConfigurationItem<infer V> ? V : never;
};