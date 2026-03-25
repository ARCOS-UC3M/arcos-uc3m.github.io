// Filtro para las tesis dirigidas.
document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('filter-phd-year');
    const clearFilterBtn = document.getElementById('clear-year-filter');
    const phdList = document.getElementById('phd-graduated-list');
    const noResultsMsg = document.getElementById('no-phd-results');

    if (!yearSelect) {
        return;
    }

    // Extraer años y rellenar el <select>
    function populateYearDropdown() {
        const listItems = phdList.querySelectorAll('li:not(#loading-msg)');
        if (listItems.length === 0) return;

        const uniqueYears = new Set();

        listItems.forEach(item => {
            const yearMatch = item.textContent.match(/\b(19|20)\d{2}\b/g);
            if (yearMatch) {
                const year = yearMatch[yearMatch.length - 1];
                uniqueYears.add(year);
                item.setAttribute('data-year', year);
            }
        });

        const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    }

    // Observar la inyección de los alumnos
    const observer = new MutationObserver((mutations, obs) => {
        const items = phdList.querySelectorAll('li:not(#loading-msg)');
        if (items.length > 0) {
            populateYearDropdown();
            obs.disconnect();
        }
    });
    observer.observe(phdList, { childList: true });

    // Función centralizada para aplicar el filtro visual
    function applyFilter(selectedYear) {
        const listItems = phdList.querySelectorAll('li:not(#loading-msg)');
        let hasVisibleItems = false;

        listItems.forEach(item => {
            const itemYear = item.getAttribute('data-year');

            if (selectedYear === 'all' || itemYear === selectedYear) {
                item.style.display = '';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        if (!hasVisibleItems && listItems.length > 0) {
            noResultsMsg.classList.remove('hidden');
        } else {
            noResultsMsg.classList.add('hidden');
        }

        // Mostrar u ocultar el botón de "Limpiar" dependiendo de si hay un filtro activo
        if (selectedYear !== 'all') {
            clearFilterBtn.classList.remove('hidden');
        } else {
            clearFilterBtn.classList.add('hidden');
        }
    }

    if (!yearSelect) return;

    // Escuchar cambios en el selector
    yearSelect.addEventListener('change', (e) => {
        applyFilter(e.target.value);
    });

    // clic en el botón de limpiar
    clearFilterBtn.addEventListener('click', () => {
        yearSelect.value = 'all'; // Devolver el selector a "All Years"
        applyFilter('all');       // Ejecutar el filtro para mostrar todo de nuevo
    });

});


// Hacer que los enlaces del menú lateral abran los acordeones correspondientes
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const allDetails = document.querySelectorAll('details.group');

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Extraemos el ID destino
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        // Devolvemos el estado de todos los enlaces.
        sidebarLinks.forEach(l => {
            l.classList.remove('text-brand-600', 'border-brand-600', 'font-bold');
            l.classList.add('text-gray-600', 'border-transparent', 'font-medium');
        });

        // Iluminamos el enlace clickeado.
        link.classList.remove('text-gray-600', 'border-transparent', 'font-medium');
        link.classList.add('text-brand-600', 'border-brand-600', 'font-bold');                       

        // Efecto Acordeón: Cerramos todos los <details> EXCEPTO el que acabamos de clicar
        allDetails.forEach(details => {
            if (details.id !== targetId) {
                details.open = false;
            }
        });

        // Abrimos el elemento destino si es un <details>
        if (targetElement && targetElement.tagName === 'DETAILS') {
            targetElement.open = true;
        }
    });
});

// Iluminar menú activo
// detección de las secciones cuando estén cerca de la mitad superior de la pantalla
const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
};

// Cambia el color de las opciones del borde izquierdo conforme se navega.
// TOCHECK: si hay poco contenido o se colapsan todas las secciones no se marca el valor corrector por
// que la navegaciójn lo va cambiando.
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Si la sección entra en el área visible que configuramos...
        if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');

            // Revisamos todos los enlaces del menú lateral
            sidebarLinks.forEach(link => {
                if (link.getAttribute('href') === `#${currentId}`) {
                    // ENLACE ACTIVO: Le damos el color de tu marca, lo hacemos negrita y marcamos el borde izquierdo
                    link.classList.remove('text-gray-600', 'border-transparent', 'font-medium');
                    link.classList.add('text-brand-600', 'border-brand-600', 'font-bold');
                } else {
                    // ENLACE INACTIVO: Le devolvemos su estilo gris normal
                    link.classList.add('text-gray-600', 'border-transparent', 'font-medium');
                    link.classList.remove('text-brand-600', 'border-brand-600', 'font-bold');
                }
            });
        }
    });
}, observerOptions);

// Seleccionamos la sección 'About' y todos los '<details>' que tengan un ID, y los empezamos a vigilar
// const sectionsToObserve = document.querySelectorAll('section[id], details[id]');
// sectionsToObserve.forEach(section => {
//     scrollObserver.observe(section);
// });