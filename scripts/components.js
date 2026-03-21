
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
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Lógica para detectar si estamos en esa página
        const isActive = (currentPath.includes(href) && href !== 'index.html' && href !== '#') ||
                         ((currentPath.endsWith('/') || currentPath.includes('index.html')) && href === 'index.html');

        if (isActive) {
            link.classList.add('text-brand-600', 'font-bold');
            link.classList.remove('text-gray-600');
        }
    });
}