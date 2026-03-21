
document.addEventListener("DOMContentLoaded", () => {
    // Cargar Navbar    
    loadNavbar("/navbar.html", () => {
        highlightActiveLink(); // Callback para iluminar el enlace después de cargar
    });

    // Cargar Footer
    loadComponent("footer-container", "/footer.html");
});

// Función genérica para cargar HTML externo
function loadComponent(elementId, filePath, callback) {
    const element = document.getElementById(elementId);
    if (!element) return; // Si no existe el contenedor en esta página, no hacemos nada

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Error cargando ${filePath}`);
            return response.text();
        })
        .then(data => {
            element.innerHTML = data;
            if (callback) callback();
        })
        .catch(error => console.error(error));
}

function loadNavbar(filePath, callback) {
    const body = document.body;
    if (!body) return;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Error loading ${filePath}`);
            return response.text();
        })
        .then(data => {
            // Usa insertAdjacentHTML para inyectar el HTML antes del primer hijo 
            body.insertAdjacentHTML('afterbegin', data);

            // padding en body para que el footer no quede tapado por el menú en la versión de celuar
            body.classList.add('pb-16', 'md:pb-0');
            if (callback) callback();
        })
        .catch(error => console.error(error));
}

// Función para resaltar la página actual en el menú
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash; // capturamos el hash de la sección
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Detectamos si es un enlace del menú de celular 
        // (tienen la clase flex-col para apilar el icono y el texto)
        const isMobileLink = link.classList.contains('flex-col');

        // se limpian las clases de todos los enlaces
        link.classList.remove('text-brand-600', 'font-bold');
        link.classList.add('text-gray-600'); // Color apagado por defecto

        // color inactivo según el tipo de menú
        if (isMobileLink) {
            link.classList.add('text-gray-500');
        } else {
            link.classList.add('text-gray-600');
        }
        
        let isActive = false;

        // lógica para detectar si estamos en esa página o sección
        if (href.includes('#')) {
            // Es un enlace de sección (ej: /index.html#research)
            const partes = href.split('#');
            const linkPath = partes[0];
            const linkHash = '#' + partes[1];
            
            const mismaPagina = currentPath.endsWith(linkPath) || (currentPath.endsWith('/') && linkPath === '/index.html');
            isActive = mismaPagina && currentHash === linkHash;
        } else {
            // es un enlace de página normal (ej: /members.html o /index.html)
            if (href === '/index.html' || href === '/') {
                // Solo iluminar "About" si estamos en index y NO hay ninguna sección (#) seleccionada
                isActive = (currentPath.endsWith('/') || currentPath.endsWith('index.html')) && currentHash === '';
            } else {
                isActive = currentPath.includes(href);
            }
        }
        
        // Aplicamos el color resaltado al elemento activo
        if (isActive) {
            // Quitamos los grises
            link.classList.remove('text-gray-500', 'text-gray-600');
            // Ponemos el azul 
            link.classList.add('text-brand-600');
            // Solo aplicamos negrita si es el menú de escritorio
            if (!isMobileLink) {
                link.classList.add('font-bold');
            }
        }
    });
}
// listener para que la función se ejecute automáticamente 
// cuando navegamos entre secciones (#) de una misma página.
window.addEventListener('hashchange', highlightActiveLink);