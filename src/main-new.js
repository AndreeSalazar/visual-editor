// Visual Web Studio - Main Application
const { invoke } = window.__TAURI__.core;

// ==================== STATE ====================
const state = {
    elements: [],
    selectedElement: null,
    history: [],
    historyIndex: -1,
    frameworks: ['fontawesome'],
    customCSS: '',
    customJS: '',
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
    showRulers: true,
    currentCodeTab: 'html',
    currentTool: 'select',
    zoom: 100,
    viewMode: 'single'
};

// ==================== FRAMEWORK DEFINITIONS ====================
const frameworkCDNs = {
    // CSS Frameworks
    bootstrap: {
        css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
        js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
    },
    tailwind: {
        js: 'https://cdn.tailwindcss.com'
    },
    bulma: {
        css: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css'
    },
    foundation: {
        css: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css',
        js: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/js/foundation.min.js'
    },
    semantic: {
        css: 'https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css',
        js: 'https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js'
    },
    uikit: {
        css: 'https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/css/uikit.min.css',
        js: 'https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/js/uikit.min.js'
    },
    materialize: {
        css: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
        js: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'
    },
    skeleton: {
        css: 'https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css'
    },
    // Animations
    animate: {
        css: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
    },
    aos: {
        css: 'https://unpkg.com/aos@2.3.1/dist/aos.css',
        js: 'https://unpkg.com/aos@2.3.1/dist/aos.js'
    },
    gsap: {
        js: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
    },
    // Icons
    fontawesome: {
        css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    },
    'bootstrap-icons': {
        css: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
    },
    lucide: {
        js: 'https://unpkg.com/lucide@latest'
    },
    heroicons: {
        js: 'https://unpkg.com/heroicons@2.0.18/24/outline/index.js'
    },
    // JavaScript
    jquery: {
        js: 'https://code.jquery.com/jquery-3.7.1.min.js'
    },
    alpinejs: {
        js: 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js'
    },
    htmx: {
        js: 'https://unpkg.com/htmx.org@1.9.6'
    }
};

// ==================== ELEMENT TEMPLATES ====================
const elementTemplates = {
    // Layout
    container: { tag: 'div', content: '', defaultStyles: { maxWidth: '1200px', margin: '0 auto', padding: '20px' }, defaultClass: 'container' },
    row: { tag: 'div', content: '', defaultStyles: { display: 'flex', flexWrap: 'wrap', margin: '0 -15px' }, defaultClass: 'row' },
    column: { tag: 'div', content: '', defaultStyles: { flex: '1', padding: '0 15px', minHeight: '100px' }, defaultClass: 'col' },
    section: { tag: 'section', content: '', defaultStyles: { padding: '60px 20px', minHeight: '200px' } },
    div: { tag: 'div', content: '', defaultStyles: { padding: '20px', minHeight: '80px', backgroundColor: '#f8f9fa' } },
    flexbox: { tag: 'div', content: '', defaultStyles: { display: 'flex', gap: '16px', padding: '20px', minHeight: '80px', backgroundColor: '#e3f2fd' } },
    grid: { tag: 'div', content: '', defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', minHeight: '80px', backgroundColor: '#f3e5f5' } },
    
    // Typography
    heading: { tag: 'h1', content: 'Título Principal', defaultStyles: { fontSize: '36px', fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' } },
    paragraph: { tag: 'p', content: 'Este es un párrafo de texto. Puedes editarlo haciendo doble clic.', defaultStyles: { fontSize: '16px', lineHeight: '1.7', color: '#4a4a68', marginBottom: '16px' } },
    text: { tag: 'span', content: 'Texto', defaultStyles: { fontSize: '16px' } },
    link: { tag: 'a', content: 'Enlace', attrs: { href: '#' }, defaultStyles: { color: '#00d4ff', textDecoration: 'none', fontSize: '16px' } },
    list: { tag: 'ul', content: '<li>Elemento 1</li><li>Elemento 2</li><li>Elemento 3</li>', defaultStyles: { paddingLeft: '20px', marginBottom: '16px' } },
    blockquote: { tag: 'blockquote', content: '"Una cita inspiradora va aquí."', defaultStyles: { borderLeft: '4px solid #00d4ff', paddingLeft: '20px', fontStyle: 'italic', color: '#6b6b80', margin: '20px 0' } },
    
    // Forms
    form: { tag: 'form', content: '', defaultStyles: { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' } },
    input: { tag: 'input', attrs: { type: 'text', placeholder: 'Escribe aquí...' }, defaultStyles: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '100%', maxWidth: '300px' } },
    textarea: { tag: 'textarea', attrs: { placeholder: 'Escribe aquí...', rows: '4' }, defaultStyles: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '100%', maxWidth: '400px', resize: 'vertical' } },
    select: { tag: 'select', content: '<option>Opción 1</option><option>Opción 2</option><option>Opción 3</option>', defaultStyles: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minWidth: '200px' } },
    checkbox: { tag: 'label', content: '<input type="checkbox"> Acepto los términos', defaultStyles: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' } },
    radio: { tag: 'label', content: '<input type="radio" name="radio"> Opción', defaultStyles: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' } },
    button: { tag: 'button', content: 'Botón', defaultStyles: { padding: '12px 28px', backgroundColor: '#00d4ff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' } },
    
    // Media
    image: { tag: 'img', attrs: { src: 'https://via.placeholder.com/400x250', alt: 'Imagen' }, defaultStyles: { maxWidth: '100%', height: 'auto', borderRadius: '8px' } },
    video: { tag: 'video', attrs: { controls: true, width: '100%' }, content: '<source src="" type="video/mp4">', defaultStyles: { maxWidth: '100%', borderRadius: '8px' } },
    audio: { tag: 'audio', attrs: { controls: true }, content: '<source src="" type="audio/mpeg">', defaultStyles: { width: '100%' } },
    iframe: { tag: 'iframe', attrs: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', width: '560', height: '315', frameborder: '0', allowfullscreen: true }, defaultStyles: { maxWidth: '100%', borderRadius: '8px' } },
    icon: { tag: 'i', attrs: { class: 'fas fa-star' }, defaultStyles: { fontSize: '32px', color: '#00d4ff' } },
    svg: { tag: 'svg', attrs: { width: '100', height: '100', viewBox: '0 0 100 100' }, content: '<circle cx="50" cy="50" r="40" fill="#00d4ff"/>', defaultStyles: {} },
    
    // UI Components
    navbar: { 
        tag: 'nav', 
        content: '<div style="display:flex;justify-content:space-between;align-items:center;max-width:1200px;margin:0 auto;padding:0 20px;"><a href="#" style="font-size:20px;font-weight:700;color:#fff;text-decoration:none;">Logo</a><div style="display:flex;gap:24px;"><a href="#" style="color:#fff;text-decoration:none;">Inicio</a><a href="#" style="color:#fff;text-decoration:none;">Servicios</a><a href="#" style="color:#fff;text-decoration:none;">Contacto</a></div></div>', 
        defaultStyles: { backgroundColor: '#1a1a2e', padding: '16px 0' } 
    },
    card: { 
        tag: 'div', 
        content: '<img src="https://via.placeholder.com/300x180" style="width:100%;border-radius:8px 8px 0 0;"><div style="padding:20px;"><h3 style="margin-bottom:8px;">Título de Card</h3><p style="color:#666;font-size:14px;">Descripción breve del contenido de esta tarjeta.</p></div>', 
        defaultStyles: { backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '300px', overflow: 'hidden' } 
    },
    modal: { tag: 'div', content: '<div style="padding:20px;"><h2>Modal Title</h2><p>Modal content goes here.</p></div>', defaultStyles: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxWidth: '500px', margin: '0 auto' } },
    carousel: { tag: 'div', content: '<div style="position:relative;overflow:hidden;border-radius:8px;"><img src="https://via.placeholder.com/800x400" style="width:100%;"></div>', defaultStyles: { maxWidth: '800px' } },
    tabs: { tag: 'div', content: '<div style="display:flex;border-bottom:2px solid #eee;"><button style="padding:12px 24px;border:none;background:transparent;border-bottom:2px solid #00d4ff;margin-bottom:-2px;cursor:pointer;">Tab 1</button><button style="padding:12px 24px;border:none;background:transparent;cursor:pointer;">Tab 2</button></div><div style="padding:20px;">Contenido del tab</div>', defaultStyles: {} },
    accordion: { tag: 'div', content: '<div style="border:1px solid #eee;border-radius:8px;"><div style="padding:16px;background:#f8f9fa;cursor:pointer;font-weight:500;">Sección 1</div><div style="padding:16px;border-top:1px solid #eee;">Contenido de la sección</div></div>', defaultStyles: {} },
    footer: { 
        tag: 'footer', 
        content: '<div style="max-width:1200px;margin:0 auto;padding:40px 20px;display:flex;justify-content:space-between;"><div><h4 style="margin-bottom:16px;">Compañía</h4><p style="color:#888;">© 2024 Mi Empresa</p></div><div style="display:flex;gap:16px;"><a href="#" style="color:#888;"><i class="fab fa-facebook"></i></a><a href="#" style="color:#888;"><i class="fab fa-twitter"></i></a><a href="#" style="color:#888;"><i class="fab fa-instagram"></i></a></div></div>', 
        defaultStyles: { backgroundColor: '#1a1a2e', color: '#fff' } 
    },
    hero: { 
        tag: 'section', 
        content: '<div style="max-width:800px;margin:0 auto;text-align:center;"><h1 style="font-size:48px;margin-bottom:24px;">Bienvenido a Mi Sitio</h1><p style="font-size:20px;color:#666;margin-bottom:32px;">Una descripción atractiva de tu producto o servicio.</p><button style="padding:16px 32px;background:#00d4ff;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Comenzar</button></div>', 
        defaultStyles: { padding: '100px 20px', backgroundColor: '#f8f9fa' } 
    }
};

// ==================== DOM ELEMENTS ====================
let canvas, propertiesPanel, layersTree, codeEditor, codeDisplay;
let viewportsContainer;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    updateCanvas();
    updateLivePreview();
    
    // Set initial view mode
    viewportsContainer.classList.add('single-view');
    canvas.classList.add('show-grid');
});

function initializeElements() {
    canvas = document.getElementById('canvas-main');
    propertiesPanel = document.getElementById('properties-editor');
    layersTree = document.getElementById('layers-tree');
    codeEditor = document.getElementById('code-editor');
    codeDisplay = document.getElementById('code-display');
    viewportsContainer = document.getElementById('viewports');
}

function setupEventListeners() {
    // Drag and Drop
    setupDragAndDrop();
    
    // Menu Items
    setupMenus();
    
    // Panel Tabs
    setupPanelTabs();
    
    // Tools
    setupTools();
    
    // View Controls
    setupViewControls();
    
    // Properties
    setupProperties();
    
    // Code Editor
    setupCodeEditor();
    
    // Modals
    setupModals();
    
    // Canvas Events
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            deselectAll();
        }
    });
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Framework checkboxes
    document.querySelectorAll('.fw-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!state.frameworks.includes(e.target.value)) {
                    state.frameworks.push(e.target.value);
                }
            } else {
                state.frameworks = state.frameworks.filter(f => f !== e.target.value);
            }
            updateLivePreview();
        });
    });
    
    // Section headers collapse
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            const grid = header.nextElementSibling;
            grid.style.display = header.classList.contains('collapsed') ? 'none' : 'grid';
        });
    });
}

// ==================== DRAG AND DROP ====================
function setupDragAndDrop() {
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('componentType', item.dataset.type);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.classList.add('drag-over');
    });
    
    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('drag-over');
    });
    
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.classList.remove('drag-over');
        
        const componentType = e.dataTransfer.getData('componentType');
        if (componentType) {
            addElement(componentType);
        }
    });
}

// ==================== MENUS ====================
function setupMenus() {
    // Export menu
    document.getElementById('menu-export')?.addEventListener('click', () => {
        document.getElementById('export-modal').classList.add('active');
    });
    
    // Undo/Redo menu
    document.getElementById('menu-undo')?.addEventListener('click', undo);
    document.getElementById('menu-redo')?.addEventListener('click', redo);
    
    // View menu
    document.getElementById('menu-single-view')?.addEventListener('click', () => setViewMode('single'));
    document.getElementById('menu-split-view')?.addEventListener('click', () => setViewMode('split-4'));
    document.getElementById('menu-toggle-grid')?.addEventListener('click', toggleGrid);
}

// ==================== PANEL TABS ====================
function setupPanelTabs() {
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const panel = tab.dataset.panel;
            const parent = tab.closest('.panel');
            
            parent.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            parent.querySelectorAll('.panel-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            const targetPanel = parent.querySelector(`#panel-${panel}`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });
}

// ==================== TOOLS ====================
function setupTools() {
    document.querySelectorAll('.tool-btn[id^="tool-"]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn[id^="tool-"]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentTool = btn.id.replace('tool-', '');
        });
    });
    
    // Undo/Redo buttons
    document.getElementById('btn-undo')?.addEventListener('click', undo);
    document.getElementById('btn-redo')?.addEventListener('click', redo);
    
    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => setZoom(state.zoom + 10));
    document.getElementById('zoom-out')?.addEventListener('click', () => setZoom(state.zoom - 10));
    document.getElementById('zoom-fit')?.addEventListener('click', () => setZoom(100));
}

// ==================== VIEW CONTROLS ====================
function setupViewControls() {
    document.getElementById('view-single')?.addEventListener('click', () => setViewMode('single'));
    document.getElementById('view-split-h')?.addEventListener('click', () => setViewMode('split-h'));
    document.getElementById('view-split-4')?.addEventListener('click', () => setViewMode('split-4'));
}

function setViewMode(mode) {
    state.viewMode = mode;
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${mode === 'single' ? 'single' : mode === 'split-h' ? 'split-h' : 'split-4'}`)?.classList.add('active');
    
    viewportsContainer.classList.remove('single-view', 'split-h', 'split-4');
    viewportsContainer.classList.add(mode === 'single' ? 'single-view' : mode);
    
    if (mode !== 'single') {
        updateLivePreview();
    }
}

function setZoom(value) {
    state.zoom = Math.max(25, Math.min(200, value));
    document.querySelector('.zoom-level').textContent = `${state.zoom}%`;
    canvas.style.transform = `scale(${state.zoom / 100})`;
    canvas.style.transformOrigin = 'top left';
}

function toggleGrid() {
    state.showGrid = !state.showGrid;
    canvas.classList.toggle('show-grid', state.showGrid);
    document.getElementById('status-grid').textContent = state.showGrid ? 'ON' : 'OFF';
}

// ==================== ELEMENT MANAGEMENT ====================
function addElement(type) {
    const template = elementTemplates[type];
    if (!template) return;
    
    const id = `el-${Date.now()}`;
    const element = {
        id,
        type,
        tag: template.tag,
        content: template.content || '',
        attrs: { ...template.attrs },
        styles: { ...template.defaultStyles },
        class: template.defaultClass || ''
    };
    
    state.elements.push(element);
    saveHistory();
    renderElement(element);
    selectElement(id);
    updateLayers();
    updateLivePreview();
    updateStatusBar();
}

function renderElement(element) {
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-element';
    wrapper.id = element.id;
    wrapper.dataset.type = element.type;
    
    const el = document.createElement(element.tag);
    
    if (element.attrs) {
        Object.entries(element.attrs).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else {
                el.setAttribute(key, value);
            }
        });
    }
    
    if (element.class) {
        el.className = (el.className ? el.className + ' ' : '') + element.class;
    }
    
    if (element.content) {
        el.innerHTML = element.content;
    }
    
    Object.entries(element.styles).forEach(([prop, value]) => {
        el.style[prop] = value;
    });
    
    wrapper.appendChild(el);
    
    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'element-actions';
    actions.innerHTML = `
        <button class="element-action" onclick="duplicateElement('${element.id}')" title="Duplicar">
            <i class="fas fa-copy"></i>
        </button>
        <button class="element-action" onclick="deleteElement('${element.id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
        </button>
    `;
    wrapper.appendChild(actions);
    
    // Resize handles
    ['nw', 'ne', 'sw', 'se'].forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        wrapper.appendChild(handle);
    });
    
    // Events
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element.id);
    });
    
    wrapper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        editElementContent(element.id);
    });
    
    makeDraggable(wrapper);
    
    canvas.appendChild(wrapper);
    canvas.classList.add('has-elements');
}

function makeDraggable(wrapper) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    wrapper.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle') || e.target.classList.contains('element-action')) return;
        if (state.currentTool !== 'select' && state.currentTool !== 'move') return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = wrapper.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        initialX = rect.left - canvasRect.left;
        initialY = rect.top - canvasRect.top;
        
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '1000';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let newX = initialX + (e.clientX - startX);
        let newY = initialY + (e.clientY - startY);
        
        if (state.snapToGrid) {
            newX = Math.round(newX / state.gridSize) * state.gridSize;
            newY = Math.round(newY / state.gridSize) * state.gridSize;
        }
        
        wrapper.style.left = `${newX}px`;
        wrapper.style.top = `${newY}px`;
        
        // Update status bar
        document.getElementById('status-position').textContent = `X: ${newX} Y: ${newY}`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            wrapper.style.zIndex = '';
            saveHistory();
            updateLivePreview();
        }
    });
}

function selectElement(id) {
    deselectAll();
    
    const wrapper = document.getElementById(id);
    if (wrapper) {
        wrapper.classList.add('selected');
        state.selectedElement = state.elements.find(el => el.id === id);
        showProperties(state.selectedElement);
        updateLayers();
        updateStatusBar();
        
        document.getElementById('no-selection')?.classList.add('hidden');
        document.getElementById('properties-editor')?.classList.remove('hidden');
    }
}

function deselectAll() {
    document.querySelectorAll('.canvas-element').forEach(el => {
        el.classList.remove('selected');
    });
    state.selectedElement = null;
    
    document.getElementById('no-selection')?.classList.remove('hidden');
    document.getElementById('properties-editor')?.classList.add('hidden');
    
    updateLayers();
    updateStatusBar();
}

window.deleteElement = function(id) {
    const index = state.elements.findIndex(el => el.id === id);
    if (index > -1) {
        state.elements.splice(index, 1);
        document.getElementById(id)?.remove();
        deselectAll();
        saveHistory();
        updateLayers();
        updateLivePreview();
        updateStatusBar();
        
        if (state.elements.length === 0) {
            canvas.classList.remove('has-elements');
        }
    }
};

window.duplicateElement = function(id) {
    const element = state.elements.find(el => el.id === id);
    if (element) {
        const newElement = JSON.parse(JSON.stringify(element));
        newElement.id = `el-${Date.now()}`;
        state.elements.push(newElement);
        renderElement(newElement);
        selectElement(newElement.id);
        saveHistory();
        updateLayers();
        updateLivePreview();
    }
};

function editElementContent(id) {
    const element = state.elements.find(el => el.id === id);
    if (!element) return;
    
    const newContent = prompt('Editar contenido:', element.content);
    if (newContent !== null) {
        element.content = newContent;
        refreshElement(element);
        showProperties(element);
        saveHistory();
        updateLivePreview();
    }
}

function refreshElement(element) {
    const wrapper = document.getElementById(element.id);
    if (!wrapper) return;
    
    const el = wrapper.querySelector(':scope > :not(.element-actions):not(.resize-handle)');
    if (!el) return;
    
    if (element.content !== undefined) {
        el.innerHTML = element.content;
    }
    
    Object.entries(element.styles).forEach(([prop, value]) => {
        el.style[prop] = value;
    });
    
    if (element.attrs) {
        Object.entries(element.attrs).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else {
                el.setAttribute(key, value);
            }
        });
    }
}

// ==================== PROPERTIES PANEL ====================
function setupProperties() {
    // Property inputs will update in real-time
    document.querySelectorAll('#properties-editor input, #properties-editor select').forEach(input => {
        input.addEventListener('change', handlePropertyChange);
        input.addEventListener('input', handlePropertyChange);
    });
}

function handlePropertyChange(e) {
    if (!state.selectedElement) return;
    
    const id = e.target.id;
    const value = e.target.value;
    
    // Map input IDs to element properties
    const styleMap = {
        'prop-width': 'width',
        'prop-height': 'height',
        'prop-display': 'display',
        'prop-position': 'position',
        'prop-font': 'fontFamily',
        'prop-font-size': 'fontSize',
        'prop-font-weight': 'fontWeight',
        'prop-color': 'color',
        'prop-bg-color': 'backgroundColor',
        'prop-border-width': 'borderWidth',
        'prop-border-style': 'borderStyle',
        'prop-border-color': 'borderColor',
        'prop-border-radius': 'borderRadius',
        'prop-opacity': 'opacity',
        'margin-top': 'marginTop',
        'margin-right': 'marginRight',
        'margin-bottom': 'marginBottom',
        'margin-left': 'marginLeft',
        'padding-top': 'paddingTop',
        'padding-right': 'paddingRight',
        'padding-bottom': 'paddingBottom',
        'padding-left': 'paddingLeft'
    };
    
    if (styleMap[id]) {
        let finalValue = value;
        
        // Add units where needed
        if (['fontSize', 'borderWidth', 'borderRadius', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(styleMap[id])) {
            finalValue = value + 'px';
        }
        
        if (styleMap[id] === 'opacity') {
            finalValue = value / 100;
            document.getElementById('opacity-value').textContent = value + '%';
        }
        
        if (styleMap[id] === 'borderRadius') {
            document.getElementById('radius-value').textContent = value + 'px';
        }
        
        state.selectedElement.styles[styleMap[id]] = finalValue;
        refreshElement(state.selectedElement);
        updateLivePreview();
    }
    
    // Handle ID and Class
    if (id === 'prop-id') {
        state.selectedElement.attrs = state.selectedElement.attrs || {};
        state.selectedElement.attrs.id = value;
        refreshElement(state.selectedElement);
    }
    
    if (id === 'prop-class') {
        state.selectedElement.class = value;
        refreshElement(state.selectedElement);
    }
    
    // Sync color hex inputs
    if (id === 'prop-color') {
        document.getElementById('prop-color-hex').value = value;
    }
    if (id === 'prop-bg-color') {
        document.getElementById('prop-bg-color-hex').value = value;
    }
    if (id === 'prop-border-color') {
        document.getElementById('prop-border-color-hex').value = value;
    }
}

function showProperties(element) {
    if (!element) return;
    
    const styles = element.styles || {};
    
    // Update property inputs
    document.getElementById('prop-type').textContent = element.type;
    document.getElementById('prop-id').value = element.attrs?.id || '';
    document.getElementById('prop-class').value = element.class || '';
    document.getElementById('prop-width').value = styles.width || 'auto';
    document.getElementById('prop-height').value = styles.height || 'auto';
    document.getElementById('prop-display').value = styles.display || 'block';
    document.getElementById('prop-position').value = styles.position || 'static';
    document.getElementById('prop-font-size').value = parseInt(styles.fontSize) || 16;
    document.getElementById('prop-font-weight').value = styles.fontWeight || '400';
    document.getElementById('prop-color').value = rgbToHex(styles.color) || '#000000';
    document.getElementById('prop-color-hex').value = rgbToHex(styles.color) || '#000000';
    document.getElementById('prop-bg-color').value = rgbToHex(styles.backgroundColor) || '#ffffff';
    document.getElementById('prop-bg-color-hex').value = rgbToHex(styles.backgroundColor) || '#ffffff';
    document.getElementById('prop-border-width').value = parseInt(styles.borderWidth) || 0;
    document.getElementById('prop-border-style').value = styles.borderStyle || 'none';
    document.getElementById('prop-border-color').value = rgbToHex(styles.borderColor) || '#000000';
    document.getElementById('prop-border-color-hex').value = rgbToHex(styles.borderColor) || '#000000';
    document.getElementById('prop-border-radius').value = parseInt(styles.borderRadius) || 0;
    document.getElementById('radius-value').textContent = (parseInt(styles.borderRadius) || 0) + 'px';
    document.getElementById('prop-opacity').value = (parseFloat(styles.opacity) || 1) * 100;
    document.getElementById('opacity-value').textContent = ((parseFloat(styles.opacity) || 1) * 100) + '%';
    
    // Spacing
    document.getElementById('margin-top').value = parseInt(styles.marginTop) || 0;
    document.getElementById('margin-right').value = parseInt(styles.marginRight) || 0;
    document.getElementById('margin-bottom').value = parseInt(styles.marginBottom) || 0;
    document.getElementById('margin-left').value = parseInt(styles.marginLeft) || 0;
    document.getElementById('padding-top').value = parseInt(styles.paddingTop) || 0;
    document.getElementById('padding-right').value = parseInt(styles.paddingRight) || 0;
    document.getElementById('padding-bottom').value = parseInt(styles.paddingBottom) || 0;
    document.getElementById('padding-left').value = parseInt(styles.paddingLeft) || 0;
}

// ==================== LAYERS ====================
function updateLayers() {
    const tree = document.getElementById('layers-tree');
    
    if (state.elements.length === 0) {
        tree.innerHTML = `
            <div class="layer-empty">
                <i class="fas fa-layer-group"></i>
                <p>Arrastra elementos al canvas</p>
            </div>
        `;
        return;
    }
    
    tree.innerHTML = state.elements.map(el => `
        <div class="layer-item ${state.selectedElement?.id === el.id ? 'active' : ''}" onclick="selectElement('${el.id}')">
            <i class="fas fa-${getIconForType(el.type)}"></i>
            <span>${el.type}</span>
        </div>
    `).join('');
}

window.selectElement = selectElement;

function getIconForType(type) {
    const icons = {
        container: 'box', row: 'grip-lines', column: 'columns', section: 'layer-group',
        div: 'square', flexbox: 'arrows-alt-h', grid: 'th',
        heading: 'heading', paragraph: 'paragraph', text: 'font', link: 'link',
        list: 'list', blockquote: 'quote-left',
        form: 'file-alt', input: 'i-cursor', textarea: 'align-left', select: 'caret-square-down',
        checkbox: 'check-square', radio: 'dot-circle', button: 'hand-pointer',
        image: 'image', video: 'video', audio: 'music', iframe: 'window-maximize',
        icon: 'icons', svg: 'bezier-curve',
        navbar: 'bars', card: 'id-card', modal: 'window-restore', carousel: 'images',
        tabs: 'folder', accordion: 'stream', footer: 'shoe-prints', hero: 'star'
    };
    return icons[type] || 'square';
}

// ==================== CODE EDITOR ====================
function setupCodeEditor() {
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentCodeTab = tab.dataset.lang;
            updateCodeEditor();
        });
    });
    
    document.querySelectorAll('.code-tab-mini').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.code-tab-mini').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentCodeTab = tab.dataset.lang;
            updateCodeDisplay();
        });
    });
    
    document.getElementById('btn-apply-code')?.addEventListener('click', applyCodeChanges);
}

function updateCodeEditor() {
    if (!codeEditor) return;
    
    switch (state.currentCodeTab) {
        case 'html':
            codeEditor.value = generateHTML();
            break;
        case 'css':
            codeEditor.value = state.customCSS || generateCSS();
            break;
        case 'js':
            codeEditor.value = state.customJS || '// Tu código JavaScript aquí\n';
            break;
    }
}

function updateCodeDisplay() {
    if (!codeDisplay) return;
    
    let code = '';
    switch (state.currentCodeTab) {
        case 'html':
            code = generateHTML();
            break;
        case 'css':
            code = state.customCSS || generateCSS();
            break;
        case 'js':
            code = state.customJS || '// JavaScript';
            break;
    }
    
    codeDisplay.querySelector('code').textContent = code;
}

function generateHTML() {
    return state.elements.map(el => {
        let attrs = '';
        if (el.attrs) {
            attrs = Object.entries(el.attrs)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');
            if (attrs) attrs = ' ' + attrs;
        }
        
        if (el.class) {
            attrs += ` class="${el.class}"`;
        }
        
        const styleStr = Object.entries(el.styles)
            .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
            .join('; ');
        
        const selfClosing = ['img', 'input', 'br', 'hr'].includes(el.tag);
        
        if (selfClosing) {
            return `<${el.tag}${attrs} style="${styleStr}">`;
        }
        
        return `<${el.tag}${attrs} style="${styleStr}">${el.content || ''}</${el.tag}>`;
    }).join('\n');
}

function generateCSS() {
    return `/* Estilos personalizados */
body {
    font-family: 'Inter', -apple-system, sans-serif;
    margin: 0;
    padding: 0;
    line-height: 1.6;
}

* {
    box-sizing: border-box;
}
`;
}

function applyCodeChanges() {
    switch (state.currentCodeTab) {
        case 'css':
            state.customCSS = codeEditor.value;
            break;
        case 'js':
            state.customJS = codeEditor.value;
            break;
    }
    updateLivePreview();
    showToast('Cambios aplicados', 'success');
}

// ==================== LIVE PREVIEW ====================
function updateLivePreview() {
    const html = generateFullHTML();
    
    // Update tablet preview
    const tabletFrame = document.getElementById('preview-tablet');
    if (tabletFrame) {
        tabletFrame.srcdoc = html;
    }
    
    // Update mobile preview
    const mobileFrame = document.getElementById('preview-mobile');
    if (mobileFrame) {
        mobileFrame.srcdoc = html;
    }
    
    // Update code display
    updateCodeDisplay();
}

function generateFullHTML() {
    let cssLinks = '';
    let jsScripts = '';
    
    state.frameworks.forEach(fw => {
        const cdn = frameworkCDNs[fw];
        if (cdn) {
            if (cdn.css) {
                cssLinks += `    <link rel="stylesheet" href="${cdn.css}">\n`;
            }
            if (cdn.js) {
                jsScripts += `    <script src="${cdn.js}"><\/script>\n`;
            }
        }
    });
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
${cssLinks}
    <style>
${state.customCSS || generateCSS()}
    </style>
</head>
<body>
${generateHTML()}
${jsScripts}
    <script>
${state.customJS || ''}
    <\/script>
</body>
</html>`;
}

// ==================== MODALS ====================
function setupModals() {
    // Close buttons
    document.querySelectorAll('.modal-close, .modal-cancel, .modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            el.closest('.modal').classList.remove('active');
        });
    });
    
    // Export button
    document.getElementById('btn-export')?.addEventListener('click', () => {
        document.getElementById('export-modal').classList.add('active');
    });
    
    // Confirm export
    document.getElementById('btn-confirm-export')?.addEventListener('click', exportProject);
    
    // Preview button
    document.getElementById('btn-preview')?.addEventListener('click', () => {
        const modal = document.getElementById('preview-modal');
        const frame = document.getElementById('preview-frame-full');
        frame.srcdoc = generateFullHTML();
        modal.classList.add('active');
    });
    
    // Preview device buttons
    document.querySelectorAll('.preview-device').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preview-device').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const device = btn.dataset.device;
            const frame = document.getElementById('preview-frame-full');
            
            switch (device) {
                case 'desktop':
                    frame.style.width = '100%';
                    break;
                case 'tablet':
                    frame.style.width = '768px';
                    break;
                case 'mobile':
                    frame.style.width = '375px';
                    break;
            }
        });
    });
}

async function exportProject() {
    const filename = document.getElementById('export-filename').value || 'proyecto.html';
    
    try {
        const fullHTML = generateFullHTML();
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        document.getElementById('export-modal').classList.remove('active');
        showToast('Proyecto exportado correctamente', 'success');
    } catch (error) {
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

// ==================== HISTORY ====================
function saveHistory() {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(JSON.stringify(state.elements));
    state.historyIndex = state.history.length - 1;
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        state.elements = JSON.parse(state.history[state.historyIndex]);
        updateCanvas();
        updateLivePreview();
        showToast('Deshacer', 'success');
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.elements = JSON.parse(state.history[state.historyIndex]);
        updateCanvas();
        updateLivePreview();
        showToast('Rehacer', 'success');
    }
}

function updateCanvas() {
    const placeholder = canvas.querySelector('.canvas-placeholder');
    canvas.innerHTML = '';
    if (placeholder) canvas.appendChild(placeholder);
    
    state.elements.forEach(element => renderElement(element));
    canvas.classList.toggle('has-elements', state.elements.length > 0);
    
    updateLayers();
    updateStatusBar();
}

// ==================== STATUS BAR ====================
function updateStatusBar() {
    document.getElementById('status-elements').textContent = state.elements.length;
    
    if (state.selectedElement) {
        document.getElementById('status-selected').textContent = state.selectedElement.type;
    } else {
        document.getElementById('status-selected').textContent = 'Nada seleccionado';
    }
}

// ==================== KEYBOARD ====================
function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'z':
                e.preventDefault();
                e.shiftKey ? redo() : undo();
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
            case 's':
                e.preventDefault();
                showToast('Proyecto guardado', 'success');
                break;
            case 'e':
                e.preventDefault();
                document.getElementById('export-modal').classList.add('active');
                break;
        }
    }
    
    if (e.key === 'Delete' && state.selectedElement) {
        deleteElement(state.selectedElement.id);
    }
    
    if (e.key === 'Escape') {
        deselectAll();
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }
    
    // Tool shortcuts
    if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'v':
                document.getElementById('tool-select')?.click();
                break;
            case 'm':
                document.getElementById('tool-move')?.click();
                break;
        }
    }
}

// ==================== UTILITIES ====================
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
    
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#000000';
    
    const hex = (x) => ('0' + parseInt(x).toString(16)).slice(-2);
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
}

function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Initialize history
saveHistory();
