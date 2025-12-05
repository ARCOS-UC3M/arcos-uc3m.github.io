// publications.js

$(document).ready(function() {
  console.log("Publications script loaded.");
  async function loadPublications() {
    try {
      const response = await fetch('publications.json');
      console.log(response);
      if (!response.ok) {
        throw new Error('Error loading publications.json');
      }
      const publications = await response.json();

      const container = document.getElementById('publicationsList');
      if (!container) {
        console.error('No element with id="publicationsList" found.');
        return;
      }

      publications.forEach(pub => {
        const borderAndBadgeClasses = getTypeClasses(pub.type);
        const hasBibtex = !!pub.bibtex;

        const html = `
          <div class="pub-item flex flex-col sm:flex-row gap-4 p-6 rounded-lg border-l-4 ${borderAndBadgeClasses.border} bg-white shadow-sm hover:shadow-md transition"
              data-year="${pub.year}" 
              data-type="${pub.type}" 
              data-authors="${pub.authorsData}">
            <div class="sm:w-32 flex-shrink-0 text-left sm:text-right">
              <span class="block text-2xl font-bold text-gray-400">${pub.year}</span>
              <span class="inline-block px-2 py-0.5 mt-1 text-xs font-bold ${borderAndBadgeClasses.badgeText} ${borderAndBadgeClasses.badgeBg} rounded uppercase">
                ${pub.badge}
              </span>
            </div>
            <div class="flex-grow">
              <h3 class="text-lg font-bold text-gray-900 leading-snug">
                ${pub.title}
              </h3>
              <p class="text-gray-700 mt-2 text-sm leading-relaxed">
                ${pub.authorsDisplay}
              </p>
              <p class="text-sm text-gray-500 italic mt-1 border-t border-gray-100 pt-2 inline-block">
                ${pub.venue}
              </p>
              ${
                hasBibtex
                  ? `
              <div class="mt-4 flex gap-2">
                <button
                  class="text-xs flex items-center px-3 py-1 border border-gray-200 rounded text-gray-500 hover:text-brand-600 hover:border-brand-600 transition"
                  type="button"
                  data-bibtex='${escapeHtml(pub.bibtex)}'
                >
                  <i class="fa-solid fa-quote-right mr-2"></i>BibTeX
                </button>
              </div>
                  `
                  : ''
              }
            </div>
          </div>
        `;

        container.insertAdjacentHTML('beforeend', html);
      });

      // Avisar de que ya hemos cargado las publicaciones
      if (window.initPublicationFilters) {
        window.initPublicationFilters();
      }

    } catch (err) {
      console.error(err);
    }
  }

  // Clases según tipo (conference/journal/etc.)
  function getTypeClasses(type) {
    if (type === 'journal') {
      return {
        border: 'border-green-600',
        badgeText: 'text-green-700',
        badgeBg: 'bg-green-100'
      };
    }
    if (type === 'workshop') {
      return {
        border: 'border-orange-500',
        badgeText: 'text-orange-700',
        badgeBg: 'bg-orange-100'
      };
    }
    // Por defecto: conference
    return {
      border: 'border-brand-600',
      badgeText: 'text-brand-700',
      badgeBg: 'bg-brand-100'
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Ejecutar carga al cargar el DOM
  loadPublications();
});