export interface ConfigurationItem<T> {
    envKey: string;
    required: boolean;
    parseFn: (value: string) => T;
}