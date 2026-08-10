import { Layout } from '../components/Layout.js';
import { StatusConsole } from '../components/StatusConsole.js';
import type { AppConfig } from '../config.js';
import { buildInfo } from '../utils/build-data.js';
import { getAllSections, getContentInventory } from '../utils/post-cache.js';

/**
 * The operations console (CR-030).
 *
 * Answers one question — what is live right now — from data compiled into this
 * Worker at build time. No credential, no runtime fetch, nothing that can go
 * stale: if this page is answering, this is the build that is answering.
 *
 * What it deliberately cannot answer is whether the *last* deployment
 * succeeded. A failed deploy ships no Worker, so the previous one keeps serving
 * and keeps reporting its own commits — correctly, and indistinguishably from a
 * deploy that never happened. `StatusConsole` says so on the page rather than
 * leaving a reader to assume it tracks the repositories.
 */
export function statusRoute(config: AppConfig) {
    const { siteTitle, socialLinks } = config;

    return (
        <Layout
            title={`Status | ${siteTitle}`}
            siteTitle={siteTitle}
            sections={getAllSections()}
            socialLinks={socialLinks}
            noindex
        >
            <StatusConsole buildInfo={buildInfo} inventory={getContentInventory()} />
        </Layout>
    );
}
