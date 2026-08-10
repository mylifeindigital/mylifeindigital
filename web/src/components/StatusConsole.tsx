import type { BuildInfo } from '../utils/build-info.js';
import type { ContentInventory } from '../utils/content-inventory.js';

/**
 * The operations console's body (CR-030).
 *
 * Split from its route so it can be tested: `routes/status.tsx` imports the
 * generated `build-data.ts`, and anything reaching a generated module from a
 * test's import graph breaks `tsconfig.test.json`, which runs before
 * `build:posts` in CI. This component takes its data as props and imports only
 * types, so it is exercised with fixtures.
 */

const UNKNOWN = 'unknown';

function Revision({ label, sha }: { label: string; sha: string | null }) {
    return (
        <div class="status-row">
            <span class="status-label">{label}</span>
            {sha ? (
                <code class="status-value status-sha">{sha}</code>
            ) : (
                <span class="status-value status-muted">{UNKNOWN}</span>
            )}
        </div>
    );
}

interface StatusConsoleProps {
    buildInfo: BuildInfo;
    inventory: ContentInventory;
}

export function StatusConsole({ buildInfo, inventory }: StatusConsoleProps) {
    const { revisions, issues } = buildInfo;

    return (
        <div class="status">
            <header class="status-header">
                <h1>What is live</h1>
                <p class="status-lede">
                    This describes the Worker serving this request, not the state of any
                    repository. The site compiles its content in at build time, so these are the
                    commits this deployment was assembled from — and they stay exactly as they are
                    until a deployment replaces them. A failed deploy changes nothing here, because
                    a failed deploy ships no Worker.
                </p>
            </header>

            <section class="status-block">
                <h2>Build</h2>
                <div class="status-row">
                    <span class="status-label">Version</span>
                    <code class="status-value">{buildInfo.version}</code>
                </div>
                <div class="status-row">
                    <span class="status-label">Built</span>
                    <time class="status-value" datetime={buildInfo.builtAt}>
                        {buildInfo.builtAt}
                    </time>
                </div>
                <div class="status-row">
                    <span class="status-label">Trigger</span>
                    <code class="status-value">{buildInfo.trigger}</code>
                </div>
            </section>

            <section class="status-block">
                <h2>Assembled from</h2>
                <Revision label="mylifeindigital" sha={revisions.app} />
                <Revision label="mylifeindigital.content" sha={revisions.content} />
                <Revision label="story-crafter" sha={revisions.story} />
                <p class="status-note">
                    Full commits, because a rollback redeploys these three refs.
                </p>
            </section>

            <section class="status-block">
                <h2>Content</h2>
                {inventory.sections.map(section => (
                    <div class="status-row">
                        <span class="status-label">{section.title}</span>
                        <span class="status-value">{section.published}</span>
                    </div>
                ))}
                <div class="status-row">
                    <span class="status-label">Standalone pages</span>
                    <span class="status-value">{inventory.standalonePages}</span>
                </div>
                <div class="status-row status-total">
                    <span class="status-label">Published items</span>
                    <span class="status-value">{inventory.totalPublished}</span>
                </div>
                <p class="status-note">
                    Drafts are not counted and are not listed. They never enter the build.
                </p>
            </section>

            <section class="status-block">
                <h2>Validation</h2>
                {issues.length === 0 ? (
                    <p class="status-clear">No validation issues in this build.</p>
                ) : (
                    <>
                        <ul class="status-issues">
                            {issues.map(issue => (
                                <li>
                                    <code class="status-file">{issue.file}</code>
                                    <span class="status-issue-detail">
                                        <code>{issue.field}</code> {issue.message}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p class="status-note">
                            These do not block publication, so the items above are live and
                            incomplete.
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}
