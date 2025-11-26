import 'dotenv/config';
import { ConfigurationItem } from './types/configurationItem.js';
import { loadConfiguration } from './utils/loadConfiguration.js';

const configurationSchema: Record<string, ConfigurationItem<any>> = {
    port: {
        envKey: 'PORT',
        required: true,
        parseFn: (value: string) => Number(value),
    },
    apiUrl: {
        envKey: 'API_URL',
        required: true,
        parseFn: (value: string) => value,
    },
    enableAI: {
        envKey: 'ENABLE_AI',
        required: false,
        parseFn: (value: string) => value === 'true',
    }
};

const configuration = loadConfiguration(configurationSchema);
console.log(configuration);
