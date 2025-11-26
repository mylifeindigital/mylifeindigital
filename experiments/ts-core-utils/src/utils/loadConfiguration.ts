import { ConfigResult } from "../types/ConfigResult.js";
import { ConfigurationItem } from "../types/configurationItem.js";

export function loadConfiguration<T extends Record<string, ConfigurationItem<any>>>(
    schema: T
): ConfigResult<T> {
    const result = {} as ConfigResult<T>;
    const errors: string[] = [];
    
    for (const [key, item] of Object.entries(schema)) {
        const envValue = process.env[item.envKey];
        
        // Check if required field is missing
        if (item.required) {
            if (envValue === undefined || envValue === '') {
                errors.push(`Required env var "${item.envKey}" (used by "${key}") is missing`);
                continue; // Skip this item, will throw later
            }
        }
        
        // Parse value
        try {
            if (envValue !== undefined && envValue !== '') {
                result[key as keyof T] = item.parseFn(envValue) as any;
            } else if (!item.required && 'defaultValue' in item) {
                result[key as keyof T] = item.defaultValue as any;
            } else if (!item.required) {
                result[key as keyof T] = undefined as any;
            }
        } catch (error) {
            errors.push(`Failed to parse "${item.envKey}": ${error}`);
        }
    }
    
    // Throw all errors at once
    if (errors.length > 0) {
        throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }
    
    return result;
}