// Load environment variables from .env file first
import 'dotenv/config';

import { loadConfiguration, createConfigItem, parsers } from 'ts-core-utils';

/**
 * Application configuration loaded from environment variables.
 * Loaded once at module initialization.
 */
export const config = loadConfiguration({
    siteTitle: createConfigItem('SITE_TITLE', parsers.string, {
        defaultValue: 'Markdown Blog'
    }),
});

