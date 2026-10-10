# Bun Shell

The supplied Bun Shell documentation is a technical reference for the exploratory [MLID Stream](../projects/mlid-stream.md) tool. The details below summarize that local snapshot; they do not establish Bun adoption or independently verified current API behavior.

## Capabilities in the Reference

- JavaScript and TypeScript invoke shell commands through the `$` tagged template imported from `bun`.
- A built-in bash-like interpreter supports pipes, redirection, globs, environment variables, and common commands across Windows, Linux, and macOS. External commands can also be resolved through `PATH`.
- JavaScript objects, including buffers, files, and responses, can supply input or receive output where supported.
- Output can be captured as text, JSON, blobs, or lines. Awaiting a command normally returns stdout and stderr buffers; `.quiet()` suppresses printing.
- Non-zero exit codes throw by default. With `.nothrow()`, the caller must inspect `exitCode`.
- `.cwd()` and `.env()` configure a command's working directory and environment; defaults can also be configured on `$`.
- Bun can run `.sh` files through its own interpreter. This reference describes scripting capabilities, not a complete interactive application design.

## Input Boundaries

The reference says interpolated strings are treated as literal arguments, protecting against shell command injection in that path. It also identifies limits: `{ raw: ... }` bypasses escaping, explicitly invoking another shell such as `bash -c` hands interpretation to that shell, and external programs can interpret an argument as an option. Argument validation remains the application's responsibility.

## Potential Use

For MLID Stream, these capabilities suggest a way to coordinate local capture and indexing commands from TypeScript. That is an inference from the reference, not a selected implementation. Note storage, AI integration, user interface, and publishing workflows remain undefined.

## Sources

- [Bun Shell reference](../../raw/bunjs/shell.md)
- [MLID Stream exploration](../../raw/mlid-streams.md)
