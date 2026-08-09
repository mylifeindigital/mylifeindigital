/**
 * Reading time estimates.
 *
 * Stories are read aloud at bedtime, not read silently, so they are paced at
 * 135 words per minute — the rate story-crafter's reading app uses. Do not
 * "correct" this to a silent-reading rate of 200–250; the number is meant to
 * tell someone how long they will be reading out loud.
 */

const READ_ALOUD_WPM = 135;

export function readAloudMinutes(source: string): number {
    const words = source.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / READ_ALOUD_WPM));
}
