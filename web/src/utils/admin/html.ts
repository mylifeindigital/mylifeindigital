export function getDashboardHtml(email: string): string {
    return `<!DOCTYPE html>
<html class="dashboard" lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard | My Life In Digital</title>
    <link rel="stylesheet" href="/styles/admin.css" />
</head>
<body>
<div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <span class="sidebar-title">Files</span>
            <div class="sidebar-actions">
                <button class="sidebar-btn" id="btn-new-file" title="New file">+</button>
                <button class="sidebar-btn" id="btn-refresh" title="Refresh">&#8635;</button>
            </div>
        </div>
        <div class="file-tree" id="file-tree">
            <div class="welcome-screen" style="padding:24px;text-align:center;">
                <div class="loading-spinner"></div>
                <p style="margin-top:8px;">Loading files...</p>
            </div>
        </div>
    </aside>

    <!-- Editor Area -->
    <div class="editor-area">
        <!-- Toolbar -->
        <div class="editor-toolbar">
            <div class="toolbar-path" id="toolbar-path">
                No file open
            </div>
            <button class="toolbar-btn primary" id="btn-save" disabled>Save</button>
            <div class="toolbar-divider"></div>
            <button class="toolbar-btn" id="btn-preview">Preview</button>
            <div class="toolbar-divider"></div>
            <div class="ai-dropdown">
                <button class="toolbar-btn" id="btn-ai">AI</button>
                <div class="ai-dropdown-menu" id="ai-menu">
                    <button class="ai-dropdown-item" data-action="rewrite">Rewrite</button>
                    <button class="ai-dropdown-item" data-action="shorten">Shorten</button>
                    <button class="ai-dropdown-item" data-action="expand">Expand</button>
                    <button class="ai-dropdown-item" data-action="explain">Explain</button>
                    <button class="ai-dropdown-item" data-action="define">Define</button>
                </div>
            </div>
        </div>

        <!-- Editor + Preview -->
        <div class="editor-container">
            <div id="monaco-editor">
                <div class="welcome-screen" id="welcome-screen">
                    <h2>Dashboard</h2>
                    <p>Select a file from the sidebar or create a new one</p>
                    <p><kbd>Ctrl+S</kbd> to save &middot; <kbd>Ctrl+P</kbd> toggle preview</p>
                </div>
            </div>
            <div class="preview-panel" id="preview-panel">
                <div class="preview-content" id="preview-content"></div>
            </div>
        </div>

        <!-- Status Bar -->
        <div class="editor-statusbar">
            <div class="status-left">
                <div class="status-indicator">
                    <span class="status-dot" id="status-dot"></span>
                    <span id="status-text">Ready</span>
                </div>
            </div>
            <div class="status-right">
                <span id="cursor-position"></span>
                <span>${email}</span>
            </div>
        </div>
    </div>
</div>

<!-- New File Dialog -->
<div class="dialog-overlay" id="new-file-dialog">
    <div class="dialog">
        <h3>New File</h3>
        <div class="dialog-field">
            <label>Section</label>
            <select id="new-file-section">
                <option value="posts">posts</option>
                <option value="technical-sessions">technical-sessions</option>
            </select>
        </div>
        <div class="dialog-field">
            <label>Slug (filename without .md)</label>
            <input type="text" id="new-file-slug" placeholder="my-new-post" />
        </div>
        <div class="dialog-actions">
            <button class="dialog-btn" id="new-file-cancel">Cancel</button>
            <button class="dialog-btn primary" id="new-file-create">Create</button>
        </div>
    </div>
</div>

<!-- Unsaved Changes Dialog -->
<div class="dialog-overlay" id="unsaved-dialog">
    <div class="dialog">
        <h3>Unsaved Changes</h3>
        <p style="font-size:0.85rem;color:#888;margin-bottom:16px;">
            You have unsaved changes. Do you want to discard them?
        </p>
        <div class="dialog-actions">
            <button class="dialog-btn" id="unsaved-cancel">Cancel</button>
            <button class="dialog-btn primary" id="unsaved-discard">Discard</button>
        </div>
    </div>
</div>

<!-- Monaco AMD Loader -->
<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js"></script>

<script>
(function() {
    'use strict';

    // ---- State ----
    let editor = null;
    let currentFile = null; // { path, sha, originalContent }
    let isModified = false;
    let previewVisible = false;
    let previewTimeout = null;
    let pendingOpenPath = null;
    let tree = [];

    // ---- DOM refs ----
    const $tree = document.getElementById('file-tree');
    const $editorEl = document.getElementById('monaco-editor');
    const $welcome = document.getElementById('welcome-screen');
    const $toolbarPath = document.getElementById('toolbar-path');
    const $btnSave = document.getElementById('btn-save');
    const $btnPreview = document.getElementById('btn-preview');
    const $btnAi = document.getElementById('btn-ai');
    const $aiMenu = document.getElementById('ai-menu');
    const $btnNew = document.getElementById('btn-new-file');
    const $btnRefresh = document.getElementById('btn-refresh');
    const $preview = document.getElementById('preview-panel');
    const $previewContent = document.getElementById('preview-content');
    const $statusDot = document.getElementById('status-dot');
    const $statusText = document.getElementById('status-text');
    const $cursorPos = document.getElementById('cursor-position');
    const $newFileDialog = document.getElementById('new-file-dialog');
    const $unsavedDialog = document.getElementById('unsaved-dialog');

    // ---- API helpers ----
    async function api(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(path, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API error');
        return data;
    }

    // ---- Status ----
    function setStatus(state, text) {
        $statusDot.className = 'status-dot ' + state;
        $statusText.textContent = text;
    }

    // ---- File tree ----
    async function loadTree() {
        try {
            const data = await api('GET', '/api/admin/content/tree');
            tree = data.tree;
            renderTree(tree);
        } catch (err) {
            $tree.innerHTML = '<div style="padding:16px;color:#ef4444;font-size:0.8rem;">Failed to load: ' + err.message + '</div>';
        }
    }

    function renderTree(entries) {
        // Group by section (first directory under content/)
        const sections = {};
        for (const entry of entries) {
            const parts = entry.path.replace('content/', '').split('/');
            if (parts.length < 2) continue;
            const section = parts[0];
            if (!sections[section]) sections[section] = [];
            sections[section].push({ ...entry, fileName: parts.slice(1).join('/') });
        }

        // Also add sections from new file dropdown that might not exist yet
        let html = '';
        const sectionNames = Object.keys(sections).sort();

        // Update new file section dropdown with discovered sections
        const $select = document.getElementById('new-file-section');
        $select.innerHTML = '';
        const allSections = new Set([...sectionNames, 'posts', 'technical-sessions']);
        for (const s of [...allSections].sort()) {
            $select.innerHTML += '<option value="' + s + '">' + s + '</option>';
        }

        for (const section of sectionNames) {
            const files = sections[section].sort((a, b) => a.fileName.localeCompare(b.fileName));
            html += '<div class="tree-section">';
            html += '<div class="tree-section-header" data-section="' + section + '">';
            html += '<span class="chevron">&#9660;</span> ' + section;
            html += ' <span style="margin-left:auto;font-size:0.7rem;opacity:0.5;">' + files.length + '</span>';
            html += '</div>';
            html += '<div class="tree-section-files">';
            for (const file of files) {
                const active = currentFile && currentFile.path === file.path ? ' active' : '';
                const modified = currentFile && currentFile.path === file.path && isModified ? ' modified' : '';
                html += '<div class="tree-file' + active + modified + '" data-path="' + file.path + '">';
                html += '<span class="file-icon">&#128196;</span>';
                html += '<span class="file-name">' + file.fileName + '</span>';
                html += '</div>';
            }
            html += '</div></div>';
        }

        $tree.innerHTML = html || '<div style="padding:16px;color:#555;font-size:0.8rem;">No files found</div>';

        // Bind click handlers
        $tree.querySelectorAll('.tree-section-header').forEach(function(el) {
            el.addEventListener('click', function() {
                el.classList.toggle('collapsed');
            });
        });
        $tree.querySelectorAll('.tree-file').forEach(function(el) {
            el.addEventListener('click', function() {
                openFile(el.dataset.path);
            });
        });
    }

    // ---- Open file ----
    async function openFile(path) {
        if (isModified) {
            pendingOpenPath = path;
            $unsavedDialog.classList.add('visible');
            return;
        }

        setStatus('saving', 'Loading...');
        try {
            const file = await api('GET', '/api/admin/content/file?path=' + encodeURIComponent(path));
            currentFile = {
                path: file.path,
                sha: file.sha,
                originalContent: file.content,
            };
            isModified = false;

            if (!editor) {
                await initMonaco();
            }

            $welcome.style.display = 'none';
            editor.setValue(file.content);
            $toolbarPath.innerHTML = '<span>' + file.path + '</span>';
            $btnSave.disabled = true;
            setStatus('saved', 'Loaded');
            updatePreview();

            // Highlight active file in tree
            $tree.querySelectorAll('.tree-file').forEach(function(el) {
                el.classList.toggle('active', el.dataset.path === path);
                el.classList.remove('modified');
            });
        } catch (err) {
            setStatus('error', err.message);
        }
    }

    // ---- Save file ----
    async function saveFile() {
        if (!currentFile || !editor) return;

        const content = editor.getValue();
        setStatus('saving', 'Saving...');
        $btnSave.disabled = true;

        try {
            const result = await api('PUT', '/api/admin/content/file?path=' + encodeURIComponent(currentFile.path), {
                content: content,
                sha: currentFile.sha,
            });
            currentFile.sha = result.sha;
            currentFile.originalContent = content;
            isModified = false;
            setStatus('saved', 'Saved');

            // Remove modified indicator
            const el = $tree.querySelector('.tree-file[data-path="' + currentFile.path + '"]');
            if (el) el.classList.remove('modified');
        } catch (err) {
            setStatus('error', 'Save failed: ' + err.message);
            $btnSave.disabled = false;
        }
    }

    // ---- New file ----
    function showNewFileDialog() {
        $newFileDialog.classList.add('visible');
        document.getElementById('new-file-slug').value = '';
        document.getElementById('new-file-slug').focus();
    }

    async function createNewFile() {
        const section = document.getElementById('new-file-section').value;
        const slug = document.getElementById('new-file-slug').value.trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) return;

        $newFileDialog.classList.remove('visible');

        const path = 'content/' + section + '/' + slug + '.md';
        const today = new Date().toISOString().split('T')[0];
        const title = slug.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });

        const template = '---\\n'
            + 'title: "' + title + '"\\n'
            + 'date: "' + today + '"\\n'
            + 'description: ""\\n'
            + 'tags: []\\n'
            + 'draft: true\\n'
            + '---\\n\\n'
            + '# ' + title + '\\n\\n'
            + 'Start writing here...\\n';

        // Set as current file (no sha = new file)
        currentFile = {
            path: path,
            sha: undefined,
            originalContent: '',
        };
        isModified = true;

        if (!editor) {
            await initMonaco();
        }

        $welcome.style.display = 'none';
        editor.setValue(template);
        $toolbarPath.innerHTML = '<span>' + path + '</span> (new)';
        $btnSave.disabled = false;
        setStatus('modified', 'New file - unsaved');
        updatePreview();
    }

    // ---- Preview ----
    function togglePreview() {
        previewVisible = !previewVisible;
        $preview.classList.toggle('visible', previewVisible);
        $btnPreview.classList.toggle('primary', previewVisible);
        if (previewVisible) updatePreview();
        if (editor) editor.layout();
    }

    function updatePreview() {
        if (!previewVisible || !editor) return;
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(async function() {
            try {
                var data = await api('POST', '/api/admin/preview', {
                    content: editor.getValue(),
                });
                var tocHtml = '';
                if (data.toc && data.toc.length > 0) {
                    tocHtml = '<nav style="margin-bottom:24px;padding:16px;border:1px solid #7c3aed44;border-radius:8px;background:#12122b;">';
                    tocHtml += '<h3 style="margin:0 0 8px;font-size:0.85rem;color:#00d4ff;text-transform:uppercase;letter-spacing:0.05em;">Contents</h3><ul style="list-style:none;margin:0;padding:0;">';
                    for (var i = 0; i < data.toc.length; i++) {
                        var entry = data.toc[i];
                        var indent = (entry.level - 1) * 16;
                        tocHtml += '<li style="padding-left:' + indent + 'px;"><a href="#' + entry.slug + '" style="color:#e0e0e0;text-decoration:none;font-size:0.85rem;line-height:1.8;opacity:' + (entry.level === 1 ? '1' : '0.8') + ';">' + entry.text + '</a></li>';
                    }
                    tocHtml += '</ul></nav>';
                }
                $previewContent.innerHTML = tocHtml + (data.html || '');
            } catch (err) {
                $previewContent.innerHTML = '<p style="color:#ef4444;">Preview error: ' + err.message + '</p>';
            }
        }, 500);
    }

    // ---- AI Transform ----
    let aiMenuVisible = false;

    function toggleAiMenu() {
        aiMenuVisible = !aiMenuVisible;
        $aiMenu.classList.toggle('visible', aiMenuVisible);
    }

    async function aiTransform(action) {
        aiMenuVisible = false;
        $aiMenu.classList.remove('visible');

        if (!editor) return;
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        if (!selectedText) {
            setStatus('error', 'Select text first');
            return;
        }

        setStatus('saving', 'AI transforming...');
        try {
            const data = await api('POST', '/api/admin/ai/transform', {
                text: selectedText,
                action: action,
            });
            editor.executeEdits('ai-transform', [{
                range: selection,
                text: data.result,
            }]);
            setStatus('saved', 'AI transform applied');
            markModified();
        } catch (err) {
            setStatus('error', 'AI error: ' + err.message);
        }
    }

    // ---- Monaco init ----
    function initMonaco() {
        return new Promise(function(resolve) {
            require.config({
                paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }
            });
            require(['vs/editor/editor.main'], function() {
                // Define cyberpunk theme
                monaco.editor.defineTheme('cyberpunk', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: '555555', fontStyle: 'italic' },
                        { token: 'keyword', foreground: '7c3aed' },
                        { token: 'string', foreground: '10b981' },
                        { token: 'number', foreground: 'f59e0b' },
                        { token: 'type', foreground: '00d4ff' },
                    ],
                    colors: {
                        'editor.background': '#0f0f23',
                        'editor.foreground': '#e0e0e0',
                        'editor.lineHighlightBackground': '#1a1a3e44',
                        'editor.selectionBackground': '#7c3aed44',
                        'editorCursor.foreground': '#00d4ff',
                        'editorLineNumber.foreground': '#555555',
                        'editorLineNumber.activeForeground': '#00d4ff',
                        'editorIndentGuide.background': '#1a1a3e',
                        'editorWidget.background': '#12122b',
                        'editorWidget.border': '#7c3aed44',
                        'input.background': '#0f0f23',
                        'input.border': '#7c3aed44',
                        'input.foreground': '#e0e0e0',
                        'focusBorder': '#00d4ff',
                        'list.activeSelectionBackground': '#7c3aed33',
                        'list.hoverBackground': '#7c3aed22',
                    }
                });

                editor = monaco.editor.create($editorEl, {
                    value: '',
                    language: 'markdown',
                    theme: 'cyberpunk',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    tabSize: 2,
                    automaticLayout: true,
                });

                // Track changes
                editor.onDidChangeModelContent(function() {
                    if (currentFile) {
                        const modified = editor.getValue() !== currentFile.originalContent;
                        if (modified !== isModified) {
                            isModified = modified;
                            $btnSave.disabled = !modified;
                            if (modified) {
                                setStatus('modified', 'Modified');
                                const el = $tree.querySelector('.tree-file[data-path="' + currentFile.path + '"]');
                                if (el) el.classList.add('modified');
                            } else {
                                setStatus('saved', 'Saved');
                                const el = $tree.querySelector('.tree-file[data-path="' + currentFile.path + '"]');
                                if (el) el.classList.remove('modified');
                            }
                        }
                    }
                    updatePreview();
                });

                // Cursor position
                editor.onDidChangeCursorPosition(function(e) {
                    $cursorPos.textContent = 'Ln ' + e.position.lineNumber + ', Col ' + e.position.column;
                });

                // Ctrl+S keybinding
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
                    saveFile();
                });

                resolve();
            });
        });
    }

    function markModified() {
        if (currentFile && editor) {
            isModified = editor.getValue() !== currentFile.originalContent;
            $btnSave.disabled = !isModified;
            if (isModified) setStatus('modified', 'Modified');
        }
    }

    // ---- Event listeners ----
    $btnSave.addEventListener('click', saveFile);
    $btnPreview.addEventListener('click', togglePreview);
    $btnNew.addEventListener('click', showNewFileDialog);
    $btnRefresh.addEventListener('click', loadTree);

    $btnAi.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAiMenu();
    });

    document.querySelectorAll('.ai-dropdown-item').forEach(function(el) {
        el.addEventListener('click', function() {
            aiTransform(el.dataset.action);
        });
    });

    // Close AI menu on outside click
    document.addEventListener('click', function() {
        if (aiMenuVisible) {
            aiMenuVisible = false;
            $aiMenu.classList.remove('visible');
        }
    });

    // Ctrl+P for preview toggle
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            togglePreview();
        }
        // Ctrl+S fallback (when editor not focused)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveFile();
        }
    });

    // New file dialog
    document.getElementById('new-file-cancel').addEventListener('click', function() {
        $newFileDialog.classList.remove('visible');
    });
    document.getElementById('new-file-create').addEventListener('click', createNewFile);
    document.getElementById('new-file-slug').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') createNewFile();
        if (e.key === 'Escape') $newFileDialog.classList.remove('visible');
    });

    // Unsaved changes dialog
    document.getElementById('unsaved-cancel').addEventListener('click', function() {
        pendingOpenPath = null;
        $unsavedDialog.classList.remove('visible');
    });
    document.getElementById('unsaved-discard').addEventListener('click', function() {
        isModified = false;
        $unsavedDialog.classList.remove('visible');
        if (pendingOpenPath) {
            openFile(pendingOpenPath);
            pendingOpenPath = null;
        }
    });

    // ---- Init ----
    loadTree();
})();
</script>
</body>
</html>`;
}
