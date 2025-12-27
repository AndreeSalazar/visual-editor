use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct ProjectData {
    html: String,
    css: String,
    js: String,
    frameworks: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ProjectConfig {
    name: String,
    path: String,
    frameworks: Vec<String>,
    preset: String,
}

#[derive(Serialize, Deserialize)]
pub struct ExportResult {
    success: bool,
    message: String,
    path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

#[tauri::command]
fn create_project(config: ProjectConfig) -> ExportResult {
    let project_path = PathBuf::from(&config.path);
    
    // Create project directory
    if let Err(e) = fs::create_dir_all(&project_path) {
        return ExportResult {
            success: false,
            message: format!("Error creating project directory: {}", e),
            path: None,
        };
    }
    
    // Create subdirectories
    let dirs = ["css", "js", "images", "fonts"];
    for dir in dirs {
        let dir_path = project_path.join(dir);
        if let Err(e) = fs::create_dir_all(&dir_path) {
            return ExportResult {
                success: false,
                message: format!("Error creating {} directory: {}", dir, e),
                path: None,
            };
        }
    }
    
    // Create index.html with selected frameworks
    let html_content = generate_html_template(&config.name, &config.frameworks);
    let html_path = project_path.join("index.html");
    if let Err(e) = fs::write(&html_path, html_content) {
        return ExportResult {
            success: false,
            message: format!("Error creating index.html: {}", e),
            path: None,
        };
    }
    
    // Create styles.css
    let css_content = generate_css_template();
    let css_path = project_path.join("css").join("styles.css");
    if let Err(e) = fs::write(&css_path, css_content) {
        return ExportResult {
            success: false,
            message: format!("Error creating styles.css: {}", e),
            path: None,
        };
    }
    
    // Create main.js
    let js_content = generate_js_template();
    let js_path = project_path.join("js").join("main.js");
    if let Err(e) = fs::write(&js_path, js_content) {
        return ExportResult {
            success: false,
            message: format!("Error creating main.js: {}", e),
            path: None,
        };
    }
    
    // Create project config file
    let config_json = serde_json::to_string_pretty(&config).unwrap_or_default();
    let config_path = project_path.join("project.json");
    let _ = fs::write(&config_path, config_json);
    
    // Create package.json for npm/bun/pnpm/yarn
    let package_json = generate_package_json(&config.name, &config.frameworks);
    let package_path = project_path.join("package.json");
    if let Err(e) = fs::write(&package_path, package_json) {
        return ExportResult {
            success: false,
            message: format!("Error creating package.json: {}", e),
            path: None,
        };
    }
    
    ExportResult {
        success: true,
        message: "Project created successfully".to_string(),
        path: Some(config.path),
    }
}

fn generate_package_json(name: &str, frameworks: &[String]) -> String {
    let mut dependencies = Vec::new();
    let mut dev_dependencies = Vec::new();
    
    // Add dependencies based on selected frameworks
    for fw in frameworks {
        match fw.as_str() {
            "react" => {
                dependencies.push("\"react\": \"^18.2.0\"");
                dependencies.push("\"react-dom\": \"^18.2.0\"");
            }
            "vue" => {
                dependencies.push("\"vue\": \"^3.4.0\"");
            }
            "svelte" => {
                dependencies.push("\"svelte\": \"^4.2.0\"");
            }
            "nextjs" => {
                dependencies.push("\"next\": \"^14.0.0\"");
                dependencies.push("\"react\": \"^18.2.0\"");
                dependencies.push("\"react-dom\": \"^18.2.0\"");
            }
            "nuxt" => {
                dependencies.push("\"nuxt\": \"^3.9.0\"");
            }
            "vite" => {
                dev_dependencies.push("\"vite\": \"^5.0.0\"");
            }
            "tailwind" => {
                dev_dependencies.push("\"tailwindcss\": \"^3.4.0\"");
                dev_dependencies.push("\"autoprefixer\": \"^10.4.0\"");
                dev_dependencies.push("\"postcss\": \"^8.4.0\"");
            }
            _ => {}
        }
    }
    
    let deps_str = if dependencies.is_empty() {
        String::new()
    } else {
        format!(",\n  \"dependencies\": {{\n    {}\n  }}", dependencies.join(",\n    "))
    };
    
    let dev_deps_str = if dev_dependencies.is_empty() {
        String::new()
    } else {
        format!(",\n  \"devDependencies\": {{\n    {}\n  }}", dev_dependencies.join(",\n    "))
    };
    
    format!(r#"{{
  "name": "{}",
  "version": "1.0.0",
  "description": "Proyecto creado con Visual Web Studio",
  "main": "index.html",
  "scripts": {{
    "dev": "npx live-server --port=3000",
    "start": "npx live-server --port=3000",
    "build": "echo 'No build step required for static HTML'"
  }},
  "keywords": ["web", "html", "css", "javascript"],
  "author": "",
  "license": "MIT"{}{}
}}"#, name, deps_str, dev_deps_str)
}

fn generate_html_template(name: &str, frameworks: &[String]) -> String {
    let mut css_links = String::new();
    let mut js_scripts = String::new();
    
    for fw in frameworks {
        match fw.as_str() {
            // CSS Frameworks
            "bootstrap" => {
                css_links.push_str("    <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js\"></script>\n");
            }
            "tailwind" => {
                js_scripts.push_str("    <script src=\"https://cdn.tailwindcss.com\"></script>\n");
            }
            "bulma" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css\">\n");
            }
            "foundation" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/js/foundation.min.js\"></script>\n");
            }
            "semantic-ui" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js\"></script>\n");
            }
            "uikit" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/css/uikit.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/uikit@3.17.11/dist/js/uikit.min.js\"></script>\n");
            }
            "materialize" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js\"></script>\n");
            }
            "skeleton" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css\">\n");
            }
            "pure-css" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css\">\n");
            }
            "milligram" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css\">\n");
            }
            "spectre" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://unpkg.com/spectre.css/dist/spectre.min.css\">\n");
            }
            "primer" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://unpkg.com/@primer/css@21.0.7/dist/primer.css\">\n");
            }
            "pico" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css\">\n");
            }
            "water-css" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/water.css@2/out/water.css\">\n");
            }
            "mvp-css" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://unpkg.com/mvp.css\">\n");
            }
            "chota" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://unpkg.com/chota@latest\">\n");
            }
            // Animations
            "animate-css" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css\">\n");
            }
            "aos" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://unpkg.com/aos@2.3.1/dist/aos.css\">\n");
                js_scripts.push_str("    <script src=\"https://unpkg.com/aos@2.3.1/dist/aos.js\"></script>\n");
            }
            "gsap" => {
                js_scripts.push_str("    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js\"></script>\n");
            }
            "motion-one" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/motion@10.16.2/dist/motion.min.js\"></script>\n");
            }
            "animejs" => {
                js_scripts.push_str("    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js\"></script>\n");
            }
            "popmotion" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/popmotion@11.0.3/dist/popmotion.min.js\"></script>\n");
            }
            // Icons
            "fontawesome" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">\n");
            }
            "bootstrap-icons" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css\">\n");
            }
            "feather-icons" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/feather-icons\"></script>\n");
            }
            "lucide" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/lucide@latest\"></script>\n");
            }
            "heroicons" => {
                js_scripts.push_str("    <!-- Heroicons - Use via SVG or React component -->\n");
            }
            "ionicons" => {
                js_scripts.push_str("    <script type=\"module\" src=\"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js\"></script>\n");
            }
            "material-icons" => {
                css_links.push_str("    <link href=\"https://fonts.googleapis.com/icon?family=Material+Icons\" rel=\"stylesheet\">\n");
            }
            "tabler-icons" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css\">\n");
            }
            "phosphor-icons" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/@phosphor-icons/web\"></script>\n");
            }
            "boxicons" => {
                css_links.push_str("    <link href=\"https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css\" rel=\"stylesheet\">\n");
            }
            "remix-icons" => {
                css_links.push_str("    <link href=\"https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css\" rel=\"stylesheet\">\n");
            }
            // JavaScript Libraries
            "jquery" => {
                js_scripts.push_str("    <script src=\"https://code.jquery.com/jquery-3.7.1.min.js\"></script>\n");
            }
            "alpinejs" => {
                js_scripts.push_str("    <script defer src=\"https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js\"></script>\n");
            }
            "htmx" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/htmx.org@1.9.6\"></script>\n");
            }
            "petite-vue" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/petite-vue\" defer init></script>\n");
            }
            "hyperscript" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/hyperscript.org@0.9.11\"></script>\n");
            }
            "stimulus" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/@hotwired/stimulus/dist/stimulus.umd.js\"></script>\n");
            }
            "turbo" => {
                js_scripts.push_str("    <script type=\"module\" src=\"https://unpkg.com/@hotwired/turbo@7.3.0/dist/turbo.es2017-esm.js\"></script>\n");
            }
            "lodash" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js\"></script>\n");
            }
            "axios" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js\"></script>\n");
            }
            "dayjs" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js\"></script>\n");
            }
            // UI Components
            "swiper" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js\"></script>\n");
            }
            "splide" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js\"></script>\n");
            }
            "glightbox" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/glightbox/dist/js/glightbox.min.js\"></script>\n");
            }
            "tippy" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/@popperjs/core@2\"></script>\n");
                js_scripts.push_str("    <script src=\"https://unpkg.com/tippy.js@6\"></script>\n");
            }
            "sweetalert2" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/sweetalert2@11\"></script>\n");
            }
            "toastify" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/toastify-js\"></script>\n");
            }
            "notyf" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js\"></script>\n");
            }
            // Charts & Data Visualization
            "chartjs" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>\n");
            }
            "apexcharts" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/apexcharts\"></script>\n");
            }
            "d3" => {
                js_scripts.push_str("    <script src=\"https://d3js.org/d3.v7.min.js\"></script>\n");
            }
            // Forms
            "choices" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js\"></script>\n");
            }
            "flatpickr" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/flatpickr\"></script>\n");
            }
            "imask" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/imask\"></script>\n");
            }
            // Scroll & Parallax
            "scrollreveal" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/scrollreveal\"></script>\n");
            }
            "locomotive-scroll" => {
                css_links.push_str("    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.css\">\n");
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js\"></script>\n");
            }
            "rellax" => {
                js_scripts.push_str("    <script src=\"https://cdn.jsdelivr.net/npm/rellax@1.12.1/rellax.min.js\"></script>\n");
            }
            "lenis" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/@studio-freight/lenis@1.0.19/dist/lenis.min.js\"></script>\n");
            }
            // Fonts
            "google-fonts" => {
                css_links.push_str("    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n");
                css_links.push_str("    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n");
                css_links.push_str("    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">\n");
            }
            // JavaScript Frameworks (CDN versions for prototyping)
            "react" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/react@18/umd/react.development.js\" crossorigin></script>\n");
                js_scripts.push_str("    <script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\" crossorigin></script>\n");
            }
            "vue" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/vue@3/dist/vue.global.js\"></script>\n");
            }
            "angular" => {
                js_scripts.push_str("    <!-- Angular requires CLI setup: npm install -g @angular/cli && ng new my-app -->\n");
            }
            "svelte" => {
                js_scripts.push_str("    <!-- Svelte requires build setup: npm create svelte@latest my-app -->\n");
            }
            "preact" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/preact@10/dist/preact.umd.js\"></script>\n");
                js_scripts.push_str("    <script src=\"https://unpkg.com/preact@10/hooks/dist/hooks.umd.js\"></script>\n");
            }
            "solid" => {
                js_scripts.push_str("    <!-- SolidJS requires build setup: npx degit solidjs/templates/js my-app -->\n");
            }
            "lit" => {
                js_scripts.push_str("    <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/lit@3/+esm\"></script>\n");
            }
            "mithril" => {
                js_scripts.push_str("    <script src=\"https://unpkg.com/mithril/mithril.js\"></script>\n");
            }
            // Meta-Frameworks (setup instructions)
            "nextjs" => {
                js_scripts.push_str("    <!-- Next.js: npx create-next-app@latest my-app -->\n");
            }
            "nuxt" => {
                js_scripts.push_str("    <!-- Nuxt 3: npx nuxi@latest init my-app -->\n");
            }
            "astro" => {
                js_scripts.push_str("    <!-- Astro: npm create astro@latest -->\n");
            }
            "remix" => {
                js_scripts.push_str("    <!-- Remix: npx create-remix@latest -->\n");
            }
            "sveltekit" => {
                js_scripts.push_str("    <!-- SvelteKit: npm create svelte@latest my-app -->\n");
            }
            "gatsby" => {
                js_scripts.push_str("    <!-- Gatsby: npm init gatsby -->\n");
            }
            "vite" => {
                js_scripts.push_str("    <!-- Vite: npm create vite@latest my-app -->\n");
            }
            _ => {}
        }
    }
    
    let html = format!(
        "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <meta name=\"description\" content=\"{}\">\n    <title>{}</title>\n    \n{}{}    <link rel=\"stylesheet\" href=\"css/styles.css\">\n</head>\n<body>\n    <header>\n        <nav>\n            <div class=\"container\">\n                <a href=\"#\" class=\"logo\">{}</a>\n                <ul class=\"nav-links\">\n                    <li><a href=\"#\">Inicio</a></li>\n                    <li><a href=\"#\">Servicios</a></li>\n                    <li><a href=\"#\">Acerca</a></li>\n                    <li><a href=\"#\">Contacto</a></li>\n                </ul>\n            </div>\n        </nav>\n    </header>\n    <section class=\"hero\">\n        <div class=\"container\">\n            <h1>Bienvenido a {}</h1>\n            <p>Tu proyecto web esta listo para comenzar.</p>\n            <a href=\"#\" class=\"btn\">Comenzar</a>\n        </div>\n    </section>\n    <main>\n        <section class=\"features\">\n            <div class=\"container\">\n                <h2>Caracteristicas</h2>\n                <div class=\"grid\">\n                    <div class=\"card\">\n                        <h3>Rapido</h3>\n                        <p>Optimizado para el mejor rendimiento.</p>\n                    </div>\n                    <div class=\"card\">\n                        <h3>Moderno</h3>\n                        <p>Diseno actual y responsive.</p>\n                    </div>\n                    <div class=\"card\">\n                        <h3>Flexible</h3>\n                        <p>Facil de personalizar.</p>\n                    </div>\n                </div>\n            </div>\n        </section>\n    </main>\n    <footer>\n        <div class=\"container\">\n            <p>2024 {}. Todos los derechos reservados.</p>\n        </div>\n    </footer>\n{}    <script src=\"js/main.js\"></script>\n</body>\n</html>",
        name, name, css_links, js_scripts, name, name, name, js_scripts
    );
    html
}

fn generate_css_template() -> String {
    r#"/* ==================== 
   Custom Styles
   ==================== */

/* Reset & Base */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --secondary: #64748b;
    --success: #22c55e;
    --danger: #ef4444;
    --warning: #f59e0b;
    --dark: #1e293b;
    --light: #f8fafc;
    --gray: #94a3b8;
    --font-main: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --radius: 8px;
    --transition: all 0.3s ease;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-main);
    font-size: 16px;
    line-height: 1.6;
    color: var(--dark);
    background-color: var(--light);
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
}

h1 { font-size: 3rem; }
h2 { font-size: 2.5rem; }
h3 { font-size: 1.75rem; }

p {
    margin-bottom: 1rem;
    color: var(--secondary);
}

a {
    color: var(--primary);
    text-decoration: none;
    transition: var(--transition);
}

a:hover {
    color: var(--primary-hover);
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 28px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.btn:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

/* Header & Navigation */
header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: var(--shadow);
    z-index: 1000;
}

nav .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--dark);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 32px;
}

.nav-links a {
    color: var(--secondary);
    font-weight: 500;
}

.nav-links a:hover {
    color: var(--primary);
}

/* Hero Section */
.hero {
    padding: 160px 0 100px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.hero h1 {
    font-size: 3.5rem;
    margin-bottom: 1.5rem;
}

.hero p {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 2rem;
}

.hero .btn {
    background: white;
    color: var(--primary);
}

.hero .btn:hover {
    background: var(--light);
}

/* Features Section */
.features {
    padding: 100px 0;
}

.features h2 {
    text-align: center;
    margin-bottom: 3rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.card {
    background: white;
    padding: 30px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card h3 {
    color: var(--primary);
    margin-bottom: 0.5rem;
}

/* Footer */
footer {
    background: var(--dark);
    color: var(--gray);
    padding: 40px 0;
    text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
    h1 { font-size: 2rem; }
    h2 { font-size: 1.75rem; }
    
    .hero {
        padding: 120px 0 80px;
    }
    
    .hero h1 {
        font-size: 2.5rem;
    }
    
    .nav-links {
        display: none;
    }
}
"#.to_string()
}

fn generate_js_template() -> String {
    r##"// Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    initNavigation();
    initScrollEffects();
    initAnimations();
});

function initNavigation() {
    const nav = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function initScrollEffects() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initAnimations() {
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, easing: 'ease-out', once: true });
    }
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
"##.to_string()
}

#[tauri::command]
fn read_project_files(path: String) -> Result<Vec<FileInfo>, String> {
    let project_path = PathBuf::from(&path);
    
    if !project_path.exists() {
        return Err("Project path does not exist".to_string());
    }
    
    let mut files = Vec::new();
    
    fn read_dir_recursive(dir: &PathBuf, files: &mut Vec<FileInfo>, base_path: &PathBuf) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let metadata = entry.metadata().ok();
                
                let relative_path = path.strip_prefix(base_path)
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| path.to_string_lossy().to_string());
                
                files.push(FileInfo {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: relative_path,
                    is_dir: path.is_dir(),
                    size: metadata.map(|m| m.len()).unwrap_or(0),
                });
                
                if path.is_dir() {
                    read_dir_recursive(&path, files, base_path);
                }
            }
        }
    }
    
    read_dir_recursive(&project_path, &mut files, &project_path);
    Ok(files)
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Error reading file: {}", e))
}

#[tauri::command]
fn write_file_content(path: String, content: String) -> ExportResult {
    match fs::write(&path, content) {
        Ok(_) => ExportResult {
            success: true,
            message: "File saved successfully".to_string(),
            path: Some(path),
        },
        Err(e) => ExportResult {
            success: false,
            message: format!("Error saving file: {}", e),
            path: None,
        },
    }
}

#[tauri::command]
fn save_project(path: String, data: ProjectData) -> ExportResult {
    let project_path = PathBuf::from(&path);
    
    if let Some(parent) = project_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return ExportResult {
                success: false,
                message: format!("Error creating directory: {}", e),
                path: None,
            };
        }
    }

    let json_data = match serde_json::to_string_pretty(&data) {
        Ok(json) => json,
        Err(e) => {
            return ExportResult {
                success: false,
                message: format!("Error serializing data: {}", e),
                path: None,
            };
        }
    };

    match fs::write(&project_path, json_data) {
        Ok(_) => ExportResult {
            success: true,
            message: "Project saved successfully".to_string(),
            path: Some(path),
        },
        Err(e) => ExportResult {
            success: false,
            message: format!("Error saving file: {}", e),
            path: None,
        },
    }
}

#[tauri::command]
fn load_project(path: String) -> Result<ProjectData, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Error reading file: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Error parsing JSON: {}", e))
}

#[tauri::command]
fn export_html(path: String, data: ProjectData) -> ExportResult {
    let export_path = PathBuf::from(&path);
    
    if let Some(parent) = export_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return ExportResult {
                success: false,
                message: format!("Error creating directory: {}", e),
                path: None,
            };
        }
    }

    let framework_links: String = data.frameworks.iter().map(|f| {
        match f.as_str() {
            "bootstrap" => r#"<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>"#.to_string(),
            "tailwind" => r#"<script src="https://cdn.tailwindcss.com"></script>"#.to_string(),
            "bulma" => r#"<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">"#.to_string(),
            "materialize" => r#"<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>"#.to_string(),
            _ => String::new()
        }
    }).collect::<Vec<_>>().join("\n    ");

    let html_content = format!(
        r#"<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Project</title>
    {}
    <style>
{}
    </style>
</head>
<body>
{}
    <script>
{}
    </script>
</body>
</html>"#,
        framework_links,
        data.css,
        data.html,
        data.js
    );

    match fs::write(&export_path, html_content) {
        Ok(_) => ExportResult {
            success: true,
            message: "HTML exported successfully".to_string(),
            path: Some(path),
        },
        Err(e) => ExportResult {
            success: false,
            message: format!("Error exporting HTML: {}", e),
            path: None,
        },
    }
}

// Terminal command execution
#[derive(Serialize)]
pub struct CommandOutput {
    success: bool,
    stdout: String,
    stderr: String,
}

#[tauri::command]
fn run_terminal_command(command: String, cwd: String) -> CommandOutput {
    use std::process::Command;
    
    // Check if this is a long-running command (dev server)
    let is_dev_server = command.contains("run dev") || 
                        command.contains("live-server") || 
                        command.contains("npm start") ||
                        command.contains("bun dev");
    
    if is_dev_server {
        // Spawn detached process for dev servers
        let spawn_result = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", "start", "cmd", "/K", &command])
                .current_dir(&cwd)
                .spawn()
        } else {
            Command::new("sh")
                .args(["-c", &format!("{} &", command)])
                .current_dir(&cwd)
                .spawn()
        };
        
        match spawn_result {
            Ok(_) => CommandOutput {
                success: true,
                stdout: format!("Servidor de desarrollo iniciado en una nueva ventana.\nComando: {}\nDirectorio: {}", command, cwd),
                stderr: String::new(),
            },
            Err(e) => CommandOutput {
                success: false,
                stdout: String::new(),
                stderr: format!("Error al iniciar servidor: {}", e),
            },
        }
    } else {
        // Regular command - wait for output
        let output = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", &command])
                .current_dir(&cwd)
                .output()
        } else {
            Command::new("sh")
                .args(["-c", &command])
                .current_dir(&cwd)
                .output()
        };
        
        match output {
            Ok(out) => CommandOutput {
                success: out.status.success(),
                stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                stderr: String::from_utf8_lossy(&out.stderr).to_string(),
            },
            Err(e) => CommandOutput {
                success: false,
                stdout: String::new(),
                stderr: format!("Error executing command: {}", e),
            },
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            create_project,
            save_project,
            load_project,
            export_html,
            read_project_files,
            read_file_content,
            write_file_content,
            run_terminal_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
