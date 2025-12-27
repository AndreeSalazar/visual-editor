// Visual Web Studio - Main Application
const { invoke } = window.__TAURI__.core;

// State
const state = {
    projectPath: '',
    projectName: '',
    selectedPreset: 'starter',
    selectedFrameworks: ['fontawesome', 'google-fonts'],
    packageManager: 'bun',
    devMode: 'visual',
    files: [],
    openFiles: [],
    currentFile: null,
    fileContents: {},
    isProjectLoaded: false
};

// Framework Dependencies & Compatibility
const frameworkDependencies = {
    // Meta-frameworks require their base framework
    'nextjs': ['react'],
    'gatsby': ['react'],
    'remix': ['react'],
    'nuxt': ['vue'],
    'sveltekit': ['svelte'],
    // UI libraries that work best with specific frameworks
    'react-bootstrap': ['react', 'bootstrap'],
    'vuetify': ['vue'],
    'angular-material': ['angular'],
    // Build tools
    'vite': [],
    'webpack': [],
    'parcel': []
};

// Framework Conflicts (mutually exclusive)
const frameworkConflicts = {
    'react': ['vue', 'angular', 'svelte'],
    'vue': ['react', 'angular', 'svelte'],
    'angular': ['react', 'vue', 'svelte'],
    'svelte': ['react', 'vue', 'angular'],
    'nextjs': ['nuxt', 'sveltekit', 'gatsby', 'remix'],
    'nuxt': ['nextjs', 'sveltekit', 'gatsby', 'remix'],
    'sveltekit': ['nextjs', 'nuxt', 'gatsby', 'remix'],
    'gatsby': ['nextjs', 'nuxt', 'sveltekit', 'remix'],
    'remix': ['nextjs', 'nuxt', 'sveltekit', 'gatsby']
};

// Preset Definitions
const presets = {
    basic: [],
    starter: ['bootstrap', 'fontawesome', 'google-fonts', 'aos'],
    tailwind: ['tailwind', 'alpinejs', 'lucide', 'google-fonts'],
    pro: ['bootstrap', 'tailwind', 'gsap', 'fontawesome', 'chartjs', 'sweetalert2', 'aos', 'google-fonts', 'swiper'],
    custom: []
};

// DOM Elements
let welcomeScreen, studioContainer;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    welcomeScreen = document.getElementById('welcome-screen');
    studioContainer = document.getElementById('studio-container');
    
    setupWelcomeScreen();
    setupStudio();
});

// ==================== WELCOME SCREEN ====================
function setupWelcomeScreen() {
    // Preset selection
    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedPreset = card.dataset.preset;
            
            // Show/hide frameworks section
            const fwSection = document.getElementById('frameworks-section');
            if (state.selectedPreset === 'custom') {
                fwSection.classList.add('active');
            } else {
                fwSection.classList.remove('active');
                // Set frameworks based on preset
                state.selectedFrameworks = [...presets[state.selectedPreset]];
                updateFrameworkCheckboxes();
            }
        });
    });
    
    // Framework tabs
    document.querySelectorAll('.fw-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.fw-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            document.querySelectorAll('.fw-category').forEach(cat => {
                cat.classList.toggle('active', cat.dataset.category === category);
            });
        });
    });
    
    // Framework checkboxes with dependency handling
    document.querySelectorAll('.fw-item input').forEach(cb => {
        cb.addEventListener('change', () => {
            handleFrameworkSelection(cb.value, cb.checked);
        });
    });
    
    // Select folder button
    document.getElementById('btn-select-folder')?.addEventListener('click', selectProjectFolder);
    
    // Create project button
    document.getElementById('btn-create-project')?.addEventListener('click', createProject);
    
    // Open existing project
    document.getElementById('btn-open-existing')?.addEventListener('click', openExistingProject);
    
    // Package manager selection
    document.querySelectorAll('.pm-option input').forEach(radio => {
        radio.addEventListener('change', () => {
            state.packageManager = radio.value;
            document.querySelectorAll('.pm-option').forEach(opt => opt.classList.remove('active'));
            radio.closest('.pm-option').classList.add('active');
        });
    });
    
    // Dev mode selection
    document.querySelectorAll('.dm-option input').forEach(radio => {
        radio.addEventListener('change', () => {
            state.devMode = radio.value;
            document.querySelectorAll('.dm-option').forEach(opt => opt.classList.remove('active'));
            radio.closest('.dm-option').classList.add('active');
        });
    });
    
    // Initialize framework checkboxes
    updateFrameworkCheckboxes();
}

function updateFrameworkCheckboxes() {
    document.querySelectorAll('.fw-item input').forEach(cb => {
        cb.checked = state.selectedFrameworks.includes(cb.value);
    });
    updateFrameworkCount();
}

function updateFrameworkCount() {
    const count = state.selectedFrameworks.length;
    const countEl = document.getElementById('fw-count');
    if (countEl) countEl.textContent = count;
}

// Handle framework selection with dependencies and conflicts
function handleFrameworkSelection(framework, isSelected) {
    if (isSelected) {
        // Check for conflicts first
        const conflicts = frameworkConflicts[framework] || [];
        const activeConflicts = conflicts.filter(f => state.selectedFrameworks.includes(f));
        
        if (activeConflicts.length > 0) {
            showToast(`${framework} no es compatible con: ${activeConflicts.join(', ')}. Se desactivarán automáticamente.`, 'warning');
            // Remove conflicting frameworks
            activeConflicts.forEach(cf => {
                state.selectedFrameworks = state.selectedFrameworks.filter(f => f !== cf);
            });
        }
        
        // Add the framework
        if (!state.selectedFrameworks.includes(framework)) {
            state.selectedFrameworks.push(framework);
        }
        
        // Add required dependencies
        const deps = frameworkDependencies[framework] || [];
        deps.forEach(dep => {
            if (!state.selectedFrameworks.includes(dep)) {
                state.selectedFrameworks.push(dep);
                showToast(`${dep} agregado automáticamente (requerido por ${framework})`, 'info');
            }
        });
    } else {
        // Check if other frameworks depend on this one
        const dependents = Object.entries(frameworkDependencies)
            .filter(([fw, deps]) => deps.includes(framework) && state.selectedFrameworks.includes(fw))
            .map(([fw]) => fw);
        
        if (dependents.length > 0) {
            showToast(`No puedes desactivar ${framework} porque es requerido por: ${dependents.join(', ')}`, 'error');
            // Re-check the checkbox
            const cb = document.querySelector(`.fw-item input[value="${framework}"]`);
            if (cb) cb.checked = true;
            return;
        }
        
        // Remove the framework
        state.selectedFrameworks = state.selectedFrameworks.filter(f => f !== framework);
    }
    
    updateFrameworkCheckboxes();
    updateFrameworkCount();
}

async function selectProjectFolder() {
    try {
        // Use Tauri dialog to select folder
        const dialog = window.__TAURI__.dialog;
        if (dialog && dialog.open) {
            const selected = await dialog.open({
                directory: true,
                multiple: false,
                title: 'Selecciona la carpeta de destino'
            });
            
            if (selected) {
                const projectName = document.getElementById('project-name').value || 'mi-proyecto';
                const fullPath = `${selected}\\${projectName}`;
                document.getElementById('project-path').value = fullPath;
                state.projectPath = fullPath;
                showToast('Carpeta seleccionada correctamente', 'success');
            }
        } else {
            // Fallback: prompt for manual input
            promptManualPath();
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        promptManualPath();
    }
}

function promptManualPath() {
    const projectName = document.getElementById('project-name').value || 'mi-proyecto';
    const input = document.getElementById('project-path');
    input.removeAttribute('readonly');
    input.placeholder = 'Escribe la ruta completa, ej: C:\\Proyectos\\' + projectName;
    input.focus();
    showToast('Escribe la ruta de destino manualmente', 'info');
}

async function createProject() {
    const projectName = document.getElementById('project-name').value || 'mi-proyecto';
    const projectPath = document.getElementById('project-path').value;
    
    if (!projectPath) {
        showToast('Por favor selecciona una carpeta de destino', 'error');
        return;
    }
    
    state.projectName = projectName;
    state.projectPath = projectPath;
    
    // Get frameworks based on preset
    let frameworks = state.selectedFrameworks;
    if (state.selectedPreset !== 'custom') {
        frameworks = presets[state.selectedPreset];
    }
    
    try {
        showToast('Creando proyecto...', 'info');
        
        const result = await invoke('create_project', {
            config: {
                name: projectName,
                path: projectPath,
                frameworks: frameworks,
                preset: state.selectedPreset
            }
        });
        
        if (result.success) {
            showToast('¡Proyecto creado exitosamente!', 'success');
            
            // Switch to studio view
            welcomeScreen.classList.remove('active');
            studioContainer.classList.add('active');
            
            // Show correct workspace based on dev mode
            switchWorkspaceMode(state.devMode);
            
            // Load project files
            await loadProjectFiles();
            
            // Update project info
            document.getElementById('current-project-name').textContent = projectName;
            document.getElementById('current-project-path').textContent = projectPath;
            
            // Update terminal PM display
            updateTerminalPM();
            
            // Setup terminal after studio is visible
            setupTerminal();
            
            // Show terminal panel
            document.getElementById('terminal-panel')?.classList.add('active');
            appendToTerminal(`Proyecto "${projectName}" creado exitosamente en: ${projectPath}`, 'success');
            appendToTerminal(`Package Manager: ${state.packageManager}`, 'info');
            appendToTerminal('Usa "Install" para instalar dependencias o "Run Dev" para iniciar el servidor', 'info');
            
            // Auto-open index.html only in code mode
            if (state.devMode === 'code') {
                setTimeout(() => {
                    openFile('index.html', projectPath + '\\index.html');
                }, 500);
            } else {
                // Initialize Figma mode
                initFigmaMode();
            }
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error creating project:', error);
        showToast('Error al crear el proyecto: ' + error, 'error');
    }
}

async function openExistingProject() {
    try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
            directory: true,
            multiple: false,
            title: 'Selecciona la carpeta del proyecto'
        });
        
        if (selected) {
            state.projectPath = selected;
            state.projectName = selected.split('\\').pop() || 'Proyecto';
            
            // Switch to studio view
            welcomeScreen.classList.remove('active');
            studioContainer.classList.add('active');
            
            // Load project files
            await loadProjectFiles();
            
            // Update project info
            document.getElementById('current-project-name').textContent = state.projectName;
            document.getElementById('current-project-path').textContent = state.projectPath;
            
            showToast('Proyecto abierto', 'success');
        }
    } catch (error) {
        console.error('Error opening project:', error);
        showToast('Error al abrir el proyecto', 'error');
    }
}

// ==================== STUDIO ====================
function setupStudio() {
    // Menu actions
    document.getElementById('menu-new')?.addEventListener('click', () => {
        studioContainer.classList.remove('active');
        welcomeScreen.classList.add('active');
    });
    
    document.getElementById('menu-save')?.addEventListener('click', saveCurrentFile);
    document.getElementById('menu-preview')?.addEventListener('click', refreshPreview);
    document.getElementById('menu-refresh')?.addEventListener('click', refreshPreview);
    
    // Toolbar actions
    document.getElementById('btn-refresh-preview')?.addEventListener('click', refreshPreview);
    document.getElementById('btn-refresh')?.addEventListener('click', refreshPreview);
    document.getElementById('btn-open-browser')?.addEventListener('click', openInBrowser);
    
    // Device select
    document.getElementById('preview-device')?.addEventListener('change', (e) => {
        const preview = document.getElementById('live-preview');
        switch (e.target.value) {
            case 'desktop':
                preview.style.width = '100%';
                break;
            case 'tablet':
                preview.style.width = '768px';
                break;
            case 'mobile':
                preview.style.width = '375px';
                break;
        }
    });
    
    // Code editor changes
    const codeEditor = document.getElementById('code-editor');
    codeEditor?.addEventListener('input', debounce(() => {
        if (state.currentFile) {
            state.fileContents[state.currentFile.path] = codeEditor.value;
            refreshPreview();
        }
    }, 500));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

async function loadProjectFiles() {
    try {
        const files = await invoke('read_project_files', { path: state.projectPath });
        state.files = files;
        renderFileTree(files);
    } catch (error) {
        console.error('Error loading files:', error);
        // Create a basic file tree structure
        renderBasicFileTree();
    }
}

function renderFileTree(files) {
    const tree = document.getElementById('file-tree');
    
    // Group files by directory
    const structure = {};
    files.forEach(file => {
        const parts = file.path.split('\\');
        if (parts.length === 1) {
            structure[file.name] = file;
        } else {
            const dir = parts[0];
            if (!structure[dir]) {
                structure[dir] = { isDir: true, name: dir, children: [] };
            }
            structure[dir].children.push(file);
        }
    });
    
    let html = '';
    
    // Render files first (root level)
    Object.values(structure).forEach(item => {
        if (!item.isDir && !item.is_dir) {
            html += renderFileItem(item);
        }
    });
    
    // Render directories
    Object.values(structure).forEach(item => {
        if (item.isDir || item.is_dir) {
            html += `
                <div class="file-item folder" onclick="toggleFolder(this)">
                    <i class="fas fa-folder"></i>
                    <span>${item.name}</span>
                </div>
                <div class="folder-contents">
                    ${item.children ? item.children.map(f => renderFileItem(f)).join('') : ''}
                </div>
            `;
        }
    });
    
    tree.innerHTML = html || renderBasicFileTree();
}

function renderBasicFileTree() {
    const tree = document.getElementById('file-tree');
    tree.innerHTML = `
        <div class="file-item html" onclick="openFile('index.html', '${state.projectPath}\\\\index.html')">
            <i class="fab fa-html5"></i>
            <span>index.html</span>
        </div>
        <div class="file-item folder" onclick="toggleFolder(this)">
            <i class="fas fa-folder"></i>
            <span>css</span>
        </div>
        <div class="folder-contents">
            <div class="file-item css" onclick="openFile('styles.css', '${state.projectPath}\\\\css\\\\styles.css')">
                <i class="fab fa-css3-alt"></i>
                <span>styles.css</span>
            </div>
        </div>
        <div class="file-item folder" onclick="toggleFolder(this)">
            <i class="fas fa-folder"></i>
            <span>js</span>
        </div>
        <div class="folder-contents">
            <div class="file-item js" onclick="openFile('main.js', '${state.projectPath}\\\\js\\\\main.js')">
                <i class="fab fa-js"></i>
                <span>main.js</span>
            </div>
        </div>
        <div class="file-item folder" onclick="toggleFolder(this)">
            <i class="fas fa-folder"></i>
            <span>images</span>
        </div>
        <div class="folder-contents"></div>
    `;
}

function renderFileItem(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let icon = 'fas fa-file';
    let className = '';
    
    switch (ext) {
        case 'html':
            icon = 'fab fa-html5';
            className = 'html';
            break;
        case 'css':
            icon = 'fab fa-css3-alt';
            className = 'css';
            break;
        case 'js':
            icon = 'fab fa-js';
            className = 'js';
            break;
        case 'json':
            icon = 'fas fa-file-code';
            className = 'json';
            break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
            icon = 'fas fa-image';
            className = 'image';
            break;
    }
    
    const fullPath = `${state.projectPath}\\${file.path}`;
    return `
        <div class="file-item ${className}" onclick="openFile('${file.name}', '${fullPath.replace(/\\/g, '\\\\')}')">
            <i class="${icon}"></i>
            <span>${file.name}</span>
        </div>
    `;
}

window.toggleFolder = function(element) {
    const contents = element.nextElementSibling;
    if (contents && contents.classList.contains('folder-contents')) {
        contents.style.display = contents.style.display === 'none' ? 'block' : 'none';
        const icon = element.querySelector('i');
        icon.classList.toggle('fa-folder');
        icon.classList.toggle('fa-folder-open');
    }
};

window.openFile = async function(name, path) {
    // Normalize path
    const normalizedPath = path.replace(/\\\\/g, '\\');
    
    // Prevent duplicate opens
    if (state.currentFile?.path === normalizedPath) {
        return;
    }
    
    try {
        // Check if already in cache
        let content = state.fileContents[normalizedPath];
        
        if (!content && content !== '') {
            // Try to read from disk
            try {
                console.log('Reading file:', normalizedPath);
                content = await invoke('read_file_content', { path: normalizedPath });
                state.fileContents[normalizedPath] = content;
            } catch (e) {
                console.error('Error reading file:', e);
                // Show error but create empty content
                showToast(`Error al leer: ${name}`, 'error');
                content = `<!-- Error al cargar ${name} -->\n<!-- Verifica que el archivo existe en: ${normalizedPath} -->`;
            }
        }
        
        state.currentFile = { name, path: normalizedPath };
        
        // Update editor
        const codeEditor = document.getElementById('code-editor');
        const placeholder = document.querySelector('.editor-placeholder');
        
        if (codeEditor) {
            codeEditor.value = content || '';
            codeEditor.classList.remove('hidden');
        }
        if (placeholder) placeholder.style.display = 'none';
        
        // Add/update tab (check for duplicates)
        addEditorTab(name, normalizedPath);
        
        // Update status bar
        const statusFile = document.getElementById('status-file');
        const statusLang = document.getElementById('status-lang');
        if (statusFile) statusFile.textContent = name;
        if (statusLang) statusLang.textContent = name.split('.').pop().toUpperCase();
        
        // Highlight active file in tree
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.file-item').forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent === name) {
                item.classList.add('active');
            }
        });
        
        // Refresh preview if HTML file
        if (name.endsWith('.html')) {
            refreshPreview();
        }
    } catch (error) {
        console.error('Error opening file:', error);
        showToast('Error al abrir el archivo: ' + error, 'error');
    }
};

function addEditorTab(name, path) {
    const tabsContainer = document.getElementById('editor-tabs');
    if (!tabsContainer) return;
    
    // Normalize path for comparison
    const normalizedPath = path.replace(/\\\\/g, '\\');
    
    // Check if tab already exists
    const existingTab = Array.from(tabsContainer.querySelectorAll('.editor-tab')).find(tab => {
        const tabPath = tab.dataset.path?.replace(/\\\\/g, '\\');
        return tabPath === normalizedPath;
    });
    
    if (existingTab) {
        // Activate existing tab
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        existingTab.classList.add('active');
        return;
    }
    
    // Deactivate all tabs
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    
    // Create new tab
    const ext = name.split('.').pop().toLowerCase();
    let icon = 'fas fa-file';
    switch (ext) {
        case 'html': icon = 'fab fa-html5'; break;
        case 'css': icon = 'fab fa-css3-alt'; break;
        case 'js': icon = 'fab fa-js'; break;
        case 'json': icon = 'fas fa-file-code'; break;
    }
    
    const tab = document.createElement('button');
    tab.className = 'editor-tab active';
    tab.dataset.path = normalizedPath;
    tab.innerHTML = `
        <i class="${icon}"></i>
        <span>${name}</span>
        <span class="close-tab" onclick="event.stopPropagation(); closeTab(this.parentElement)">×</span>
    `;
    tab.onclick = (e) => {
        if (!e.target.classList.contains('close-tab')) {
            openFile(name, normalizedPath);
        }
    };
    
    tabsContainer.appendChild(tab);
    
    // Add to open files
    if (!state.openFiles.find(f => f.path === normalizedPath)) {
        state.openFiles.push({ name, path: normalizedPath });
    }
}

window.closeTab = function(tabElement) {
    if (!tabElement) return;
    
    const path = tabElement.dataset?.path;
    tabElement.remove();
    
    if (path) {
        state.openFiles = state.openFiles.filter(f => f.path !== path);
        
        // If closing current file, open another or show placeholder
        if (state.currentFile?.path === path) {
            state.currentFile = null;
            if (state.openFiles.length > 0) {
                const lastFile = state.openFiles[state.openFiles.length - 1];
                openFile(lastFile.name, lastFile.path);
            } else {
                const codeEditor = document.getElementById('code-editor');
                const placeholder = document.querySelector('.editor-placeholder');
                if (codeEditor) codeEditor.classList.add('hidden');
                if (placeholder) placeholder.style.display = 'block';
            }
        }
    }
};

async function saveCurrentFile() {
    if (!state.currentFile) {
        showToast('No hay archivo abierto', 'warning');
        return;
    }
    
    const content = document.getElementById('code-editor').value;
    state.fileContents[state.currentFile.path] = content;
    
    try {
        const result = await invoke('write_file_content', {
            path: state.currentFile.path,
            content: content
        });
        
        if (result.success) {
            showToast('Archivo guardado', 'success');
            refreshPreview();
        } else {
            showToast('Error al guardar: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving file:', error);
        showToast('Error al guardar el archivo', 'error');
    }
}

async function refreshPreview() {
    const preview = document.getElementById('live-preview');
    if (!preview || !state.projectPath) return;
    
    let htmlContent = null;
    
    // If current file is index.html, use editor content
    if (state.currentFile?.name === 'index.html') {
        const editor = document.getElementById('code-editor');
        if (editor && editor.value) {
            htmlContent = editor.value;
        }
    }
    
    // If no editor content, read from disk
    if (!htmlContent) {
        try {
            const htmlPath = state.projectPath + '\\index.html';
            htmlContent = await invoke('read_file_content', { path: htmlPath });
            state.fileContents[htmlPath] = htmlContent;
        } catch (error) {
            console.error('Error reading index.html for preview:', error);
        }
    }
    
    if (!htmlContent) {
        // Show placeholder
        preview.srcdoc = `
            <html>
            <head><style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100vh; 
                    margin: 0;
                    background: #1a1a25;
                    color: #a0a0b8;
                    text-align: center;
                }
                .placeholder { padding: 40px; }
                h2 { color: #00d4ff; margin-bottom: 10px; }
            </style></head>
            <body>
                <div class="placeholder">
                    <h2>Vista Previa</h2>
                    <p>Abre index.html para ver la vista previa</p>
                </div>
            </body>
            </html>
        `;
        return;
    }
    
    // Inject CSS if modified
    const cssPaths = [
        `${state.projectPath}\\css\\styles.css`,
        `${state.projectPath}/css/styles.css`
    ];
    for (const cssPath of cssPaths) {
        const cssContent = state.fileContents[cssPath];
        if (cssContent) {
            htmlContent = htmlContent.replace(
                /<link[^>]*href=["']css\/styles\.css["'][^>]*>/gi,
                `<style>${cssContent}</style>`
            );
            break;
        }
    }
    
    // Inject JS if modified
    const jsPaths = [
        `${state.projectPath}\\js\\main.js`,
        `${state.projectPath}/js/main.js`
    ];
    for (const jsPath of jsPaths) {
        const jsContent = state.fileContents[jsPath];
        if (jsContent) {
            htmlContent = htmlContent.replace(
                /<script[^>]*src=["']js\/main\.js["'][^>]*><\/script>/gi,
                `<script>${jsContent}</script>`
            );
            break;
        }
    }
    
    preview.srcdoc = htmlContent;
}

async function openInBrowser() {
    const htmlPath = `${state.projectPath}\\index.html`;
    try {
        const { open } = await import('@tauri-apps/plugin-opener');
        await open(htmlPath);
    } catch (error) {
        console.error('Error opening in browser:', error);
        showToast('Error al abrir en navegador', 'error');
    }
}

// ==================== KEYBOARD ====================
function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                saveCurrentFile();
                break;
            case 'n':
                e.preventDefault();
                studioContainer.classList.remove('active');
                welcomeScreen.classList.add('active');
                break;
        }
    }
    
    if (e.key === 'F5') {
        e.preventDefault();
        refreshPreview();
    }
}

// ==================== UTILITIES ====================
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    switch (type) {
        case 'success': icon = 'check-circle'; break;
        case 'error': icon = 'exclamation-circle'; break;
        case 'warning': icon = 'exclamation-triangle'; break;
    }
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: toastIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? 'var(--accent-success)' : type === 'error' ? 'var(--accent-danger)' : type === 'warning' ? 'var(--accent-warning)' : 'var(--accent-primary)'};
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ==================== WORKSPACE MODE SWITCHING ====================
function switchWorkspaceMode(mode) {
    const workspaceCode = document.getElementById('workspace-code');
    const workspaceFigma = document.getElementById('workspace-figma');
    
    if (mode === 'visual') {
        workspaceCode?.classList.add('hidden');
        workspaceFigma?.classList.remove('hidden');
        workspaceFigma?.classList.add('active');
    } else {
        workspaceCode?.classList.remove('hidden');
        workspaceFigma?.classList.add('hidden');
        workspaceFigma?.classList.remove('active');
    }
}

// ==================== FIGMA MODE - DRAG & DROP ====================
let selectedElement = null;
let draggedComponent = null;

function initFigmaMode() {
    const artboard = document.getElementById('canvas-artboard');
    if (!artboard) return;
    
    // Setup drag & drop for components
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    // Setup drop zone
    artboard.addEventListener('dragover', handleDragOver);
    artboard.addEventListener('dragleave', handleDragLeave);
    artboard.addEventListener('drop', handleDrop);
    
    // Setup canvas click to deselect
    artboard.addEventListener('click', (e) => {
        if (e.target === artboard || e.target.classList.contains('drop-hint')) {
            deselectAll();
        }
    });
    
    // Load existing project HTML into canvas
    loadProjectIntoCanvas();
    
    // Setup tool buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Setup zoom
    document.getElementById('canvas-zoom')?.addEventListener('change', (e) => {
        const zoom = parseInt(e.target.value) / 100;
        artboard.style.transform = `scale(${zoom})`;
    });
    
    // Setup panel tabs (Properties/Code)
    document.querySelectorAll('.panel-tab[data-panel]').forEach(tab => {
        tab.addEventListener('click', () => {
            const panel = tab.dataset.panel;
            document.querySelectorAll('.panel-tab[data-panel]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const codePanel = document.getElementById('figma-code-panel');
            const propsContent = document.getElementById('properties-content');
            const propsSections = document.getElementById('properties-sections');
            
            if (panel === 'code') {
                codePanel?.classList.remove('hidden');
                propsContent?.classList.add('hidden');
                propsSections?.classList.add('hidden');
                updateGeneratedCode();
            } else {
                codePanel?.classList.add('hidden');
                if (selectedElement) {
                    propsContent?.classList.add('hidden');
                    propsSections?.classList.remove('hidden');
                } else {
                    propsContent?.classList.remove('hidden');
                    propsSections?.classList.add('hidden');
                }
            }
        });
    });
    
    // Copy code button
    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
        const codeEl = document.getElementById('generated-html-code');
        if (codeEl) {
            navigator.clipboard.writeText(codeEl.textContent || '');
            showToast('Código copiado al portapapeles', 'success');
        }
    });
    
    // Open code in separate window
    document.getElementById('btn-open-code-window')?.addEventListener('click', openCodeWindow);
    
    showToast('Modo Visual activado - Arrastra componentes al canvas', 'info');
}

function handleDragStart(e) {
    draggedComponent = e.target.closest('.component-item');
    draggedComponent.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', draggedComponent.dataset.type);
}

function handleDragEnd(e) {
    if (draggedComponent) {
        draggedComponent.classList.remove('dragging');
        draggedComponent = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const artboard = document.getElementById('canvas-artboard');
    artboard?.classList.add('drag-over');
}

function handleDragLeave(e) {
    const artboard = document.getElementById('canvas-artboard');
    if (!artboard.contains(e.relatedTarget)) {
        artboard?.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const artboard = document.getElementById('canvas-artboard');
    artboard?.classList.remove('drag-over');
    
    const componentType = e.dataTransfer.getData('text/plain');
    if (!componentType || componentType === 'move') return;
    
    // Hide drop hint
    const dropHint = artboard.querySelector('.drop-hint');
    if (dropHint) dropHint.style.display = 'none';
    
    // Create element based on type
    const element = createCanvasElement(componentType);
    if (element) {
        artboard.appendChild(element);
        selectElement(element);
        showToast(`${componentType} agregado - Doble clic para editar texto`, 'success');
        
        // Update code panel and save to project
        updateGeneratedCode();
        saveCanvasToProject();
    }
}

function createCanvasElement(type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-element';
    wrapper.dataset.type = type;
    wrapper.style.cssText = 'padding: 16px; margin: 8px;';
    
    let content = '';
    
    switch (type) {
        case 'heading':
            content = '<h1 style="margin:0; font-size:32px; color:#1a1a1a;">Título Principal</h1>';
            break;
        case 'heading2':
            content = '<h2 style="margin:0; font-size:24px; color:#1a1a1a;">Subtítulo</h2>';
            break;
        case 'paragraph':
            content = '<p style="margin:0; font-size:16px; color:#666; line-height:1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>';
            break;
        case 'link':
            content = '<a href="#" style="color:#0066cc; text-decoration:none; font-size:16px;">Enlace de ejemplo</a>';
            break;
        case 'button':
            content = '<button style="padding:12px 24px; background:#0066cc; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer;">Botón</button>';
            break;
        case 'input':
            content = '<input type="text" placeholder="Escribe aquí..." style="padding:12px 16px; border:1px solid #ddd; border-radius:6px; font-size:14px; width:200px;">';
            break;
        case 'textarea':
            content = '<textarea placeholder="Escribe aquí..." style="padding:12px 16px; border:1px solid #ddd; border-radius:6px; font-size:14px; width:300px; height:100px; resize:none;"></textarea>';
            break;
        case 'image':
            content = '<div style="width:200px; height:150px; background:#f0f0f0; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#999;"><i class="fas fa-image" style="font-size:32px;"></i></div>';
            break;
        case 'div':
            wrapper.style.cssText = 'padding: 20px; margin: 8px; background: #f5f5f5; border: 1px dashed #ccc; min-height: 100px; border-radius: 8px;';
            content = '<span style="color:#999; font-size:12px;">Contenedor</span>';
            break;
        case 'section':
            wrapper.style.cssText = 'padding: 40px 20px; margin: 8px; background: #fafafa; border: 1px solid #eee; min-height: 200px;';
            content = '<span style="color:#999; font-size:12px;">Sección</span>';
            break;
        case 'container':
            wrapper.style.cssText = 'padding: 20px; margin: 8px auto; background: #fff; border: 1px solid #eee; max-width: 1140px; min-height: 100px;';
            content = '<span style="color:#999; font-size:12px;">Container (max-width: 1140px)</span>';
            break;
        case 'row':
            wrapper.style.cssText = 'display: flex; gap: 16px; padding: 16px; margin: 8px; background: #f0f8ff; border: 1px dashed #0066cc; min-height: 80px; border-radius: 8px;';
            content = '<span style="color:#0066cc; font-size:12px;">Row (Flex)</span>';
            break;
        case 'grid':
            wrapper.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; margin: 8px; background: #f0fff0; border: 1px dashed #22c55e; min-height: 80px; border-radius: 8px;';
            content = '<span style="color:#22c55e; font-size:12px;">Grid (3 columnas)</span>';
            break;
        case 'navbar':
            wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; margin: 0; background: #1a1a1a; color: white;';
            content = `
                <span style="font-weight:600; font-size:18px;">Logo</span>
                <nav style="display:flex; gap:24px;">
                    <a href="#" style="color:white; text-decoration:none;">Inicio</a>
                    <a href="#" style="color:white; text-decoration:none;">Servicios</a>
                    <a href="#" style="color:white; text-decoration:none;">Contacto</a>
                </nav>
            `;
            break;
        case 'hero':
            wrapper.style.cssText = 'padding: 80px 40px; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;';
            content = `
                <h1 style="margin:0 0 16px 0; font-size:48px;">Bienvenido</h1>
                <p style="margin:0 0 24px 0; font-size:18px; opacity:0.9;">Tu subtítulo aquí</p>
                <button style="padding:14px 32px; background:white; color:#667eea; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer;">Comenzar</button>
            `;
            break;
        case 'card':
            wrapper.style.cssText = 'padding: 0; margin: 8px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; width: 300px;';
            content = `
                <div style="height:160px; background:#f0f0f0; display:flex; align-items:center; justify-content:center;"><i class="fas fa-image" style="font-size:32px; color:#ccc;"></i></div>
                <div style="padding:20px;">
                    <h3 style="margin:0 0 8px 0; font-size:18px; color:#1a1a1a;">Título de Card</h3>
                    <p style="margin:0; font-size:14px; color:#666;">Descripción breve del contenido de esta tarjeta.</p>
                </div>
            `;
            break;
        case 'footer':
            wrapper.style.cssText = 'padding: 40px 24px; margin: 0; background: #1a1a1a; color: white; text-align: center;';
            content = '<p style="margin:0; font-size:14px; opacity:0.7;">© 2024 Tu Empresa. Todos los derechos reservados.</p>';
            break;
        case 'icon':
            content = '<i class="fas fa-star" style="font-size:32px; color:#f59e0b;"></i>';
            break;
        case 'select':
            content = '<select style="padding:12px 16px; border:1px solid #ddd; border-radius:6px; font-size:14px; width:200px;"><option>Opción 1</option><option>Opción 2</option><option>Opción 3</option></select>';
            break;
        case 'checkbox':
            content = '<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" style="width:18px; height:18px;"> <span style="font-size:14px; color:#333;">Opción</span></label>';
            break;
        case 'video':
            content = '<div style="width:320px; height:180px; background:#000; border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-play-circle" style="font-size:48px; color:white; opacity:0.8;"></i></div>';
            break;
        default:
            content = `<div style="padding:20px; background:#f0f0f0; border-radius:8px;">${type}</div>`;
    }
    
    wrapper.innerHTML = content;
    
    // Add click handler for selection
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(wrapper);
    });
    
    // Double-click to edit text content
    wrapper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        enableInlineEditing(wrapper);
    });
    
    // Make draggable within canvas
    wrapper.draggable = true;
    wrapper.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'move');
        wrapper.classList.add('dragging');
    });
    wrapper.addEventListener('dragend', () => {
        wrapper.classList.remove('dragging');
    });
    
    return wrapper;
}

// Load existing project HTML into the visual canvas
async function loadProjectIntoCanvas() {
    if (!state.projectPath) return;
    
    const artboard = document.getElementById('canvas-artboard');
    if (!artboard) return;
    
    try {
        // Read the index.html file
        const htmlPath = state.projectPath + '\\index.html';
        const htmlContent = await invoke('read_file_content', { path: htmlPath });
        
        if (!htmlContent) return;
        
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const body = doc.body;
        
        if (!body || body.children.length === 0) return;
        
        // Clear the artboard
        artboard.innerHTML = '';
        
        // Hide drop hint since we have content
        const dropHint = document.createElement('div');
        dropHint.className = 'drop-hint';
        dropHint.style.display = 'none';
        dropHint.innerHTML = '<i class="fas fa-plus-circle"></i><p>Arrastra componentes aquí</p>';
        artboard.appendChild(dropHint);
        
        // Convert HTML elements to canvas elements
        Array.from(body.children).forEach(child => {
            const canvasElement = htmlToCanvasElement(child);
            if (canvasElement) {
                artboard.appendChild(canvasElement);
            }
        });
        
        // Update code panel
        updateGeneratedCode();
        
        showToast('Proyecto cargado en el canvas visual', 'success');
        
    } catch (error) {
        console.error('Error loading project into canvas:', error);
        // Keep the empty canvas with drop hint
    }
}

// Convert HTML element to editable canvas element
function htmlToCanvasElement(htmlElement) {
    const tagName = htmlElement.tagName.toLowerCase();
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-element';
    
    // Determine element type based on tag and classes
    let type = 'div';
    
    if (tagName === 'nav' || htmlElement.classList.contains('navbar')) {
        type = 'navbar';
    } else if (tagName === 'header') {
        type = 'navbar';
    } else if (tagName === 'section' && (htmlElement.classList.contains('hero') || htmlElement.querySelector('h1'))) {
        type = 'hero';
    } else if (tagName === 'section') {
        type = 'section';
    } else if (tagName === 'footer') {
        type = 'footer';
    } else if (tagName === 'h1') {
        type = 'heading';
    } else if (tagName === 'h2' || tagName === 'h3') {
        type = 'heading2';
    } else if (tagName === 'p') {
        type = 'paragraph';
    } else if (tagName === 'button') {
        type = 'button';
    } else if (tagName === 'a') {
        type = 'link';
    } else if (tagName === 'input') {
        type = 'input';
    } else if (tagName === 'textarea') {
        type = 'textarea';
    } else if (tagName === 'img') {
        type = 'image';
    } else if (htmlElement.classList.contains('card')) {
        type = 'card';
    } else if (htmlElement.classList.contains('row') || htmlElement.classList.contains('flex')) {
        type = 'row';
    } else if (htmlElement.classList.contains('grid')) {
        type = 'grid';
    } else if (htmlElement.classList.contains('container')) {
        type = 'container';
    }
    
    wrapper.dataset.type = type;
    
    // Apply styles based on type
    applyCanvasElementStyles(wrapper, type, htmlElement);
    
    // Copy the inner HTML
    wrapper.innerHTML = htmlElement.outerHTML;
    
    // Make it interactive
    setupCanvasElementInteraction(wrapper);
    
    return wrapper;
}

// Apply visual styles to canvas element
function applyCanvasElementStyles(wrapper, type, originalElement) {
    switch (type) {
        case 'navbar':
            wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; margin: 0; background: #1a1a1a; color: white; width: 100%;';
            break;
        case 'hero':
            wrapper.style.cssText = 'padding: 60px 40px; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; width: 100%;';
            break;
        case 'section':
            wrapper.style.cssText = 'padding: 40px 20px; margin: 0; background: #fafafa; min-height: 150px; width: 100%;';
            break;
        case 'footer':
            wrapper.style.cssText = 'padding: 30px 24px; margin: 0; background: #1a1a1a; color: white; text-align: center; width: 100%;';
            break;
        case 'heading':
            wrapper.style.cssText = 'padding: 16px; margin: 8px;';
            break;
        case 'heading2':
            wrapper.style.cssText = 'padding: 12px; margin: 8px;';
            break;
        case 'paragraph':
            wrapper.style.cssText = 'padding: 8px 16px; margin: 8px;';
            break;
        case 'card':
            wrapper.style.cssText = 'padding: 0; margin: 8px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; width: 300px;';
            break;
        case 'button':
            wrapper.style.cssText = 'padding: 8px; margin: 8px; display: inline-block;';
            break;
        default:
            wrapper.style.cssText = 'padding: 16px; margin: 8px;';
    }
}

// Setup interaction handlers for canvas element
function setupCanvasElementInteraction(wrapper) {
    // Click to select
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(wrapper);
    });
    
    // Double-click to edit
    wrapper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        enableInlineEditing(wrapper);
    });
    
    // Make draggable
    wrapper.draggable = true;
    wrapper.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'move');
        wrapper.classList.add('dragging');
    });
    wrapper.addEventListener('dragend', () => {
        wrapper.classList.remove('dragging');
    });
    
    // Allow drop on this element (to add new components after it)
    wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const artboard = document.getElementById('canvas-artboard');
        artboard?.classList.add('drag-over');
    });
    
    wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const artboard = document.getElementById('canvas-artboard');
        artboard?.classList.remove('drag-over');
        
        const componentType = e.dataTransfer.getData('text/plain');
        if (!componentType || componentType === 'move') return;
        
        // Create and insert after this element
        const element = createCanvasElement(componentType);
        if (element) {
            wrapper.parentNode.insertBefore(element, wrapper.nextSibling);
            selectElement(element);
            showToast(`${componentType} agregado`, 'success');
            updateGeneratedCode();
            saveCanvasToProject();
        }
    });
}

// Enable inline editing for text elements
function enableInlineEditing(element) {
    const editableElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label');
    
    if (editableElements.length === 0) {
        // If no text elements, make the whole element editable
        element.contentEditable = true;
        element.focus();
        element.style.outline = '2px solid var(--accent-primary)';
        
        element.addEventListener('blur', () => {
            element.contentEditable = false;
            element.style.outline = '';
            updateGeneratedCode();
            saveCanvasToProject();
        }, { once: true });
    } else {
        // Make first text element editable
        const textEl = editableElements[0];
        textEl.contentEditable = true;
        textEl.focus();
        textEl.style.outline = '2px solid #00d4ff';
        textEl.style.outlineOffset = '2px';
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        textEl.addEventListener('blur', () => {
            textEl.contentEditable = false;
            textEl.style.outline = '';
            textEl.style.outlineOffset = '';
            updateGeneratedCode();
            saveCanvasToProject();
        }, { once: true });
        
        textEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textEl.blur();
            }
            if (e.key === 'Escape') {
                textEl.blur();
            }
        });
    }
    
    showToast('Editando texto - Enter para confirmar, Esc para cancelar', 'info');
}

// Save canvas state to project files
async function saveCanvasToProject() {
    if (!state.projectPath) return;
    
    const artboard = document.getElementById('canvas-artboard');
    if (!artboard) return;
    
    const elements = artboard.querySelectorAll('.canvas-element');
    
    // Generate HTML by extracting actual content from canvas elements
    let bodyContent = '';
    elements.forEach(el => {
        // Get the actual HTML inside the canvas element (skip wrapper div)
        const innerContent = el.innerHTML;
        // Clean up the HTML - remove canvas-specific classes and styles
        const cleanedHtml = cleanCanvasHtml(innerContent);
        bodyContent += cleanedHtml + '\n    ';
    });
    
    // Build full HTML with CSS link
    const html = generateFullHtmlWithStyles(bodyContent);
    
    // Save to index.html
    try {
        await invoke('write_file_content', {
            path: state.projectPath + '\\index.html',
            content: html
        });
        console.log('Canvas saved to index.html');
        // Refresh preview after saving
        refreshPreview();
    } catch (error) {
        console.error('Error saving canvas:', error);
    }
}

// Clean HTML from canvas-specific attributes
function cleanCanvasHtml(html) {
    // Remove contenteditable attributes
    let cleaned = html.replace(/\s*contenteditable="[^"]*"/gi, '');
    // Remove outline styles added during editing
    cleaned = cleaned.replace(/\s*style="[^"]*outline[^"]*"/gi, '');
    // Remove draggable attributes
    cleaned = cleaned.replace(/\s*draggable="[^"]*"/gi, '');
    return cleaned;
}

// Generate full HTML with proper structure
function generateFullHtmlWithStyles(bodyContent) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${state.projectName || 'Mi Proyecto'}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    ${bodyContent}
    <script src="js/main.js"></script>
</body>
</html>`;
}

function generateElementHtml(element, type) {
    // Get actual content from the element
    const getTextContent = (selector) => {
        const el = element.querySelector(selector);
        return el ? el.textContent : '';
    };
    
    switch (type) {
        case 'heading':
            return `<h1>${getTextContent('h1') || 'Título Principal'}</h1>`;
        case 'heading2':
            return `<h2>${getTextContent('h2') || 'Subtítulo'}</h2>`;
        case 'paragraph':
            return `<p>${getTextContent('p') || 'Lorem ipsum dolor sit amet...'}</p>`;
        case 'button':
            return `<button class="btn">${getTextContent('button') || 'Botón'}</button>`;
        case 'link':
            return `<a href="#">${getTextContent('a') || 'Enlace'}</a>`;
        case 'navbar':
            return `<nav class="navbar">
        <a href="#" class="logo">Logo</a>
        <ul class="nav-links">
            <li><a href="#">Inicio</a></li>
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Contacto</a></li>
        </ul>
    </nav>`;
        case 'hero':
            const heroTitle = getTextContent('h1') || 'Bienvenido';
            const heroSubtitle = getTextContent('p') || 'Tu subtítulo aquí';
            return `<section class="hero">
        <h1>${heroTitle}</h1>
        <p>${heroSubtitle}</p>
        <button class="btn-primary">Comenzar</button>
    </section>`;
        case 'card':
            return `<div class="card">
        <img src="imagen.jpg" alt="Card image">
        <div class="card-body">
            <h3>${getTextContent('h3') || 'Título de Card'}</h3>
            <p>${getTextContent('p') || 'Descripción breve.'}</p>
        </div>
    </div>`;
        case 'footer':
            return `<footer>
        <p>${getTextContent('p') || '© 2024 Tu Empresa. Todos los derechos reservados.'}</p>
    </footer>`;
        case 'div':
            return `<div class="container"></div>`;
        case 'section':
            return `<section></section>`;
        case 'row':
            return `<div class="row"></div>`;
        case 'grid':
            return `<div class="grid"></div>`;
        case 'input':
            return `<input type="text" placeholder="Escribe aquí...">`;
        case 'textarea':
            return `<textarea placeholder="Escribe aquí..."></textarea>`;
        case 'image':
            return `<img src="imagen.jpg" alt="Descripción">`;
        default:
            return `<div class="${type}"></div>`;
    }
}

function generateFullHtml(bodyContent) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${state.projectName || 'Mi Proyecto'}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    ${bodyContent}
    <script src="js/main.js"></script>
</body>
</html>`;
}

function selectElement(element) {
    deselectAll();
    selectedElement = element;
    element.classList.add('selected');
    
    // Show properties panel
    document.getElementById('properties-content')?.classList.add('hidden');
    document.getElementById('properties-sections')?.classList.remove('hidden');
    
    // Update properties based on element
    updatePropertiesPanel(element);
    
    // Update generated code if code panel is visible
    updateGeneratedCode();
}

// Generate HTML code from canvas elements
function updateGeneratedCode() {
    const artboard = document.getElementById('canvas-artboard');
    const codeEl = document.getElementById('generated-html-code');
    if (!artboard || !codeEl) return;
    
    const elements = artboard.querySelectorAll('.canvas-element');
    
    if (elements.length === 0) {
        codeEl.innerHTML = '<code>&lt;!-- Arrastra componentes para ver el código --&gt;</code>';
        return;
    }
    
    let html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n';
    html += '    <meta charset="UTF-8">\n';
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '    <title>' + (state.projectName || 'Mi Proyecto') + '</title>\n';
    html += '    <link rel="stylesheet" href="css/styles.css">\n';
    html += '</head>\n<body>\n';
    
    elements.forEach(el => {
        const type = el.dataset.type;
        const innerHtml = el.innerHTML;
        html += '    ' + generateCleanHtml(type, innerHtml) + '\n';
    });
    
    html += '    <script src="js/main.js"></script>\n';
    html += '</body>\n</html>';
    
    // Escape HTML for display
    codeEl.textContent = html;
}

function generateCleanHtml(type, content) {
    // Clean up the HTML for display
    switch (type) {
        case 'heading':
            return '<h1>Título Principal</h1>';
        case 'heading2':
            return '<h2>Subtítulo</h2>';
        case 'paragraph':
            return '<p>Lorem ipsum dolor sit amet...</p>';
        case 'button':
            return '<button class="btn">Botón</button>';
        case 'input':
            return '<input type="text" placeholder="Escribe aquí...">';
        case 'div':
            return '<div class="container">\n        <!-- Contenido -->\n    </div>';
        case 'section':
            return '<section>\n        <!-- Contenido de sección -->\n    </section>';
        case 'navbar':
            return '<nav class="navbar">\n        <a href="#" class="logo">Logo</a>\n        <ul class="nav-links">\n            <li><a href="#">Inicio</a></li>\n            <li><a href="#">Servicios</a></li>\n            <li><a href="#">Contacto</a></li>\n        </ul>\n    </nav>';
        case 'hero':
            return '<section class="hero">\n        <h1>Bienvenido</h1>\n        <p>Tu subtítulo aquí</p>\n        <button class="btn-primary">Comenzar</button>\n    </section>';
        case 'card':
            return '<div class="card">\n        <img src="imagen.jpg" alt="Card image">\n        <div class="card-body">\n            <h3>Título de Card</h3>\n            <p>Descripción breve.</p>\n        </div>\n    </div>';
        case 'footer':
            return '<footer>\n        <p>&copy; 2024 Tu Empresa. Todos los derechos reservados.</p>\n    </footer>';
        case 'image':
            return '<img src="imagen.jpg" alt="Descripción">';
        case 'link':
            return '<a href="#">Enlace de ejemplo</a>';
        case 'row':
            return '<div class="row">\n        <!-- Columnas -->\n    </div>';
        case 'grid':
            return '<div class="grid">\n        <!-- Items del grid -->\n    </div>';
        default:
            return `<div class="${type}"><!-- ${type} --></div>`;
    }
}

// Open code in separate window
function openCodeWindow() {
    const artboard = document.getElementById('canvas-artboard');
    if (!artboard) return;
    
    const elements = artboard.querySelectorAll('.canvas-element');
    
    let html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n';
    html += '    <meta charset="UTF-8">\n';
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '    <title>' + (state.projectName || 'Mi Proyecto') + ' - Código</title>\n';
    html += '    <style>\n';
    html += '        body { font-family: "JetBrains Mono", monospace; background: #0a0a0f; color: #e0e0e0; padding: 20px; margin: 0; }\n';
    html += '        pre { background: #12121a; padding: 20px; border-radius: 8px; overflow: auto; border: 1px solid #2a2a3d; }\n';
    html += '        code { color: #00d4ff; }\n';
    html += '        h1 { color: #00d4ff; font-size: 18px; margin-bottom: 20px; }\n';
    html += '        .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }\n';
    html += '        button { padding: 8px 16px; background: #00d4ff; color: #0a0a0f; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }\n';
    html += '        button:hover { background: #00b8e6; }\n';
    html += '    </style>\n';
    html += '</head>\n<body>\n';
    html += '    <h1>📄 Código HTML Generado - ' + (state.projectName || 'Mi Proyecto') + '</h1>\n';
    html += '    <div class="toolbar">\n';
    html += '        <button onclick="copyCode()">📋 Copiar Código</button>\n';
    html += '        <button onclick="downloadCode()">💾 Descargar HTML</button>\n';
    html += '    </div>\n';
    html += '    <pre><code id="code-content">';
    
    // Generate the actual code
    let generatedCode = '&lt;!DOCTYPE html&gt;\n&lt;html lang="es"&gt;\n&lt;head&gt;\n';
    generatedCode += '    &lt;meta charset="UTF-8"&gt;\n';
    generatedCode += '    &lt;title&gt;' + (state.projectName || 'Mi Proyecto') + '&lt;/title&gt;\n';
    generatedCode += '    &lt;link rel="stylesheet" href="css/styles.css"&gt;\n';
    generatedCode += '&lt;/head&gt;\n&lt;body&gt;\n';
    
    elements.forEach(el => {
        const type = el.dataset.type;
        generatedCode += '    ' + escapeHtmlForDisplay(generateCleanHtml(type, '')) + '\n';
    });
    
    generatedCode += '    &lt;script src="js/main.js"&gt;&lt;/script&gt;\n';
    generatedCode += '&lt;/body&gt;\n&lt;/html&gt;';
    
    html += generatedCode;
    html += '</code></pre>\n';
    html += '    <script>\n';
    html += '        function copyCode() {\n';
    html += '            const code = document.getElementById("code-content").textContent;\n';
    html += '            navigator.clipboard.writeText(code).then(() => alert("¡Código copiado!"));\n';
    html += '        }\n';
    html += '        function downloadCode() {\n';
    html += '            const code = document.getElementById("code-content").textContent;\n';
    html += '            const blob = new Blob([code], {type: "text/html"});\n';
    html += '            const a = document.createElement("a");\n';
    html += '            a.href = URL.createObjectURL(blob);\n';
    html += '            a.download = "index.html";\n';
    html += '            a.click();\n';
    html += '        }\n';
    html += '    </script>\n';
    html += '</body>\n</html>';
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
    }
}

function escapeHtmlForDisplay(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function deselectAll() {
    document.querySelectorAll('.canvas-element.selected').forEach(el => {
        el.classList.remove('selected');
    });
    selectedElement = null;
    
    // Hide properties panel
    document.getElementById('properties-content')?.classList.remove('hidden');
    document.getElementById('properties-sections')?.classList.add('hidden');
}

function updatePropertiesPanel(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const artboard = document.getElementById('canvas-artboard');
    const artboardRect = artboard?.getBoundingClientRect() || { left: 0, top: 0 };
    
    // Update size fields
    const widthInput = document.getElementById('prop-width');
    const heightInput = document.getElementById('prop-height');
    if (widthInput) widthInput.value = Math.round(rect.width) || '';
    if (heightInput) heightInput.value = Math.round(rect.height) || '';
    
    // Update position fields
    const xInput = document.getElementById('prop-x');
    const yInput = document.getElementById('prop-y');
    if (xInput) xInput.value = Math.round(rect.left - artboardRect.left) || 0;
    if (yInput) yInput.value = Math.round(rect.top - artboardRect.top) || 0;
    
    // Update spacing fields
    const paddingInput = document.getElementById('prop-padding');
    const marginInput = document.getElementById('prop-margin');
    if (paddingInput) paddingInput.value = parseInt(computed.padding) || 0;
    if (marginInput) marginInput.value = parseInt(computed.margin) || 0;
    
    // Update color fields
    const bgColor = document.getElementById('prop-bg-color');
    const bgColorText = document.getElementById('prop-bg-color-text');
    if (bgColor && bgColorText) {
        const bg = rgbToHex(computed.backgroundColor);
        bgColor.value = bg;
        bgColorText.value = bg;
    }
    
    // Update text color
    const textColor = document.getElementById('prop-text-color');
    const textColorText = document.getElementById('prop-text-color-text');
    if (textColor && textColorText) {
        const color = rgbToHex(computed.color);
        textColor.value = color;
        textColorText.value = color;
    }
    
    // Update font fields
    const fontFamily = document.getElementById('prop-font-family');
    const fontSize = document.getElementById('prop-font-size');
    const fontWeight = document.getElementById('prop-font-weight');
    if (fontFamily) {
        const family = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        fontFamily.value = family || 'Inter';
    }
    if (fontSize) fontSize.value = parseInt(computed.fontSize) || 16;
    if (fontWeight) {
        const weight = computed.fontWeight;
        if (weight === '700' || weight === 'bold') fontWeight.value = 'Bold';
        else if (weight === '500' || weight === '600') fontWeight.value = 'Medium';
        else fontWeight.value = 'Regular';
    }
    
    // Update border fields
    const borderRadius = document.getElementById('prop-border-radius');
    const borderWidth = document.getElementById('prop-border-width');
    const borderColor = document.getElementById('prop-border-color');
    if (borderRadius) borderRadius.value = parseInt(computed.borderRadius) || 0;
    if (borderWidth) borderWidth.value = parseInt(computed.borderWidth) || 0;
    if (borderColor) borderColor.value = rgbToHex(computed.borderColor);
}

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    if (rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#ffffff';
    
    const r = parseInt(match[0]).toString(16).padStart(2, '0');
    const g = parseInt(match[1]).toString(16).padStart(2, '0');
    const b = parseInt(match[2]).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
}

// Initialize Figma mode when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup property change handlers
    setupPropertyHandlers();
    // Setup terminal
    setupTerminal();
    // Setup mode switching
    setupModeSwitching();
});

// ==================== MODE SWITCHING ====================
function setupModeSwitching() {
    // Toggle mode button
    document.getElementById('menu-toggle-mode')?.addEventListener('click', toggleMode);
    document.getElementById('menu-mode-visual')?.addEventListener('click', () => switchToMode('visual'));
    document.getElementById('menu-mode-code')?.addEventListener('click', () => switchToMode('code'));
    
    // Keyboard shortcut Ctrl+M
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleMode();
        }
    });
}

function toggleMode() {
    const newMode = state.devMode === 'visual' ? 'code' : 'visual';
    switchToMode(newMode);
}

function switchToMode(mode) {
    state.devMode = mode;
    
    const workspaceCode = document.getElementById('workspace-code');
    const workspaceFigma = document.getElementById('workspace-figma');
    const modeLabel = document.getElementById('current-mode-label');
    
    if (mode === 'visual') {
        workspaceCode?.classList.add('hidden');
        workspaceFigma?.classList.remove('hidden');
        if (modeLabel) {
            modeLabel.innerHTML = '<i class="fas fa-palette"></i> Visual';
        }
        // Initialize Figma mode and load canvas
        initFigmaMode();
        showToast('Modo Visual activado', 'info');
    } else {
        workspaceFigma?.classList.add('hidden');
        workspaceCode?.classList.remove('hidden');
        if (modeLabel) {
            modeLabel.innerHTML = '<i class="fas fa-code"></i> Código';
        }
        // Reload files and refresh preview
        loadProjectFiles();
        refreshPreview();
        showToast('Modo Código activado', 'info');
    }
}

// ==================== TERMINAL ====================
function setupTerminal() {
    console.log('Setting up terminal...');
    
    const terminalPanel = document.getElementById('terminal-panel');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    
    // Toggle terminal visibility
    const btnShowTerminal = document.getElementById('btn-show-terminal');
    if (btnShowTerminal) {
        btnShowTerminal.addEventListener('click', () => {
            console.log('Show terminal clicked');
            terminalPanel?.classList.toggle('active');
        });
    }
    
    const btnToggleTerminal = document.getElementById('btn-toggle-terminal');
    if (btnToggleTerminal) {
        btnToggleTerminal.addEventListener('click', () => {
            console.log('Toggle terminal clicked');
            terminalPanel?.classList.remove('active');
        });
    }
    
    // Clear terminal
    const btnClearTerminal = document.getElementById('btn-clear-terminal');
    if (btnClearTerminal) {
        btnClearTerminal.addEventListener('click', () => {
            console.log('Clear terminal clicked');
            if (terminalOutput) {
                terminalOutput.innerHTML = `
                    <div class="terminal-line welcome">
                        <span class="terminal-prefix">$</span>
                        <span>Terminal limpiado</span>
                    </div>
                `;
            }
        });
    }
    
    // Run dev server
    const btnRunDev = document.getElementById('btn-run-dev');
    if (btnRunDev) {
        console.log('btn-run-dev found, adding listener');
        btnRunDev.addEventListener('click', async () => {
            console.log('Run Dev clicked');
            await runDevServer();
        });
    } else {
        console.log('btn-run-dev NOT found');
    }
    
    // Install dependencies
    const btnInstallDeps = document.getElementById('btn-install-deps');
    if (btnInstallDeps) {
        console.log('btn-install-deps found, adding listener');
        btnInstallDeps.addEventListener('click', async () => {
            console.log('Install clicked');
            await installDependencies();
        });
    } else {
        console.log('btn-install-deps NOT found');
    }
    
    // Terminal input
    if (terminalInput) {
        terminalInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && terminalInput.value.trim()) {
                const command = terminalInput.value.trim();
                terminalInput.value = '';
                await executeCommand(command);
            }
        });
    }
    
    // Terminal tabs
    document.querySelectorAll('.terminal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.terminal-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    console.log('Terminal setup complete');
}

function appendToTerminal(text, type = 'info') {
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalOutput) return;
    
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.className = `terminal-line ${type}`;
        lineEl.innerHTML = `<span>${escapeHtml(line)}</span>`;
        terminalOutput.appendChild(lineEl);
    });
    
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function appendCommand(command) {
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalOutput) return;
    
    const lineEl = document.createElement('div');
    lineEl.className = 'terminal-line command';
    lineEl.innerHTML = `<span class="terminal-prefix">$</span><span>${escapeHtml(command)}</span>`;
    terminalOutput.appendChild(lineEl);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function executeCommand(command) {
    console.log('executeCommand called with:', command);
    console.log('state.projectPath:', state.projectPath);
    
    if (!state.projectPath) {
        appendToTerminal('Error: No hay proyecto abierto. Crea un proyecto primero.', 'error');
        return;
    }
    
    appendCommand(command);
    appendToTerminal('Ejecutando...', 'info');
    
    try {
        console.log('Invoking run_terminal_command...');
        const result = await invoke('run_terminal_command', {
            command: command,
            cwd: state.projectPath
        });
        
        console.log('Command result:', result);
        
        if (result.stdout) {
            appendToTerminal(result.stdout, result.success ? 'success' : 'info');
        }
        if (result.stderr) {
            appendToTerminal(result.stderr, result.success ? 'info' : 'error');
        }
        if (!result.stdout && !result.stderr) {
            appendToTerminal(result.success ? 'Comando completado exitosamente' : 'El comando falló', result.success ? 'success' : 'error');
        }
    } catch (error) {
        console.error('Error executing command:', error);
        appendToTerminal(`Error al ejecutar comando: ${error}`, 'error');
    }
}

async function runDevServer() {
    const pm = state.packageManager || 'bun';
    let command = '';
    
    switch (pm) {
        case 'bun':
            command = 'bun run dev';
            break;
        case 'npm':
            command = 'npm run dev';
            break;
        case 'pnpm':
            command = 'pnpm dev';
            break;
        case 'yarn':
            command = 'yarn dev';
            break;
    }
    
    // Show terminal
    document.getElementById('terminal-panel')?.classList.add('active');
    
    appendToTerminal(`Iniciando servidor de desarrollo con ${pm}...`, 'info');
    await executeCommand(command);
}

async function installDependencies() {
    const pm = state.packageManager || 'bun';
    let command = '';
    
    switch (pm) {
        case 'bun':
            command = 'bun install';
            break;
        case 'npm':
            command = 'npm install';
            break;
        case 'pnpm':
            command = 'pnpm install';
            break;
        case 'yarn':
            command = 'yarn';
            break;
    }
    
    // Show terminal
    document.getElementById('terminal-panel')?.classList.add('active');
    
    appendToTerminal(`Instalando dependencias con ${pm}...`, 'info');
    await executeCommand(command);
}

// Update terminal PM display when project is created
function updateTerminalPM() {
    const pmDisplay = document.getElementById('terminal-pm');
    const statusPm = document.getElementById('status-pm');
    if (pmDisplay) pmDisplay.textContent = state.packageManager;
    if (statusPm) statusPm.innerHTML = `<i class="fas fa-box"></i> ${state.packageManager}`;
}

function setupPropertyHandlers() {
    // Background color
    document.getElementById('prop-bg-color')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.backgroundColor = e.target.value;
            document.getElementById('prop-bg-color-text').value = e.target.value;
        }
    });
    
    // Text color
    document.getElementById('prop-text-color')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.color = e.target.value;
            document.getElementById('prop-text-color-text').value = e.target.value;
        }
    });
    
    // Width
    document.getElementById('prop-width')?.addEventListener('input', (e) => {
        if (selectedElement && e.target.value) {
            selectedElement.style.width = e.target.value + 'px';
        }
    });
    
    // Height
    document.getElementById('prop-height')?.addEventListener('input', (e) => {
        if (selectedElement && e.target.value) {
            selectedElement.style.height = e.target.value + 'px';
        }
    });
    
    // Padding
    document.getElementById('prop-padding')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.padding = e.target.value + 'px';
        }
    });
    
    // Margin
    document.getElementById('prop-margin')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.margin = e.target.value + 'px';
        }
    });
    
    // Border radius
    document.getElementById('prop-border-radius')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.borderRadius = e.target.value + 'px';
        }
    });
    
    // Font size
    document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
        if (selectedElement) {
            selectedElement.style.fontSize = e.target.value + 'px';
        }
    });
    
    // Font family
    document.getElementById('prop-font-family')?.addEventListener('change', (e) => {
        if (selectedElement) {
            selectedElement.style.fontFamily = e.target.value;
        }
    });
    
    // Font weight
    document.getElementById('prop-font-weight')?.addEventListener('change', (e) => {
        if (selectedElement) {
            selectedElement.style.fontWeight = e.target.value;
        }
    });
}
