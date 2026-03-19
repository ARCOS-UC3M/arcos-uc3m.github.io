// CARGAR Y FILTRAR PUBLICACIONES (Últimos 10 Journals)
async function loadPublications() {
    const container = document.getElementById('publications-list');

    const urlParams = new URLSearchParams(window.location.search);
    // TODO: hacer genérico, member debería ser un ID no un nombre. El id debe estar además en publications.json para no depender del nombre.
    //const member = urlParams.get('member');

    const authorToSearch = window.PROFILE_CONFIG.searchName
    // console.log("El valor de 'member' capturado de la URL es:", authorToSearch);

    try {
        const response = await fetch('/publications.json');
        if (!response.ok) throw new Error('Error al cargar publications.json');

        const allPublications = await response.json();

        // Filtrar: Solo 'journal' Y que contenga a 'Carretero' (en authorsDisplay o authorsData)
        let filteredPubs = allPublications.filter(pub => {
            const isJournal = pub.type === 'journal';
            // Buscamos el nombre asegurándonos de que funcione independientemente de si incluye la inicial o no
            const isAuthor = pub.authorsDisplay.includes(`${authorToSearch}`) || pub.authorsData.includes(`${authorToSearch}`);

            return isJournal && isAuthor;
        });

        // Ordenar: De más reciente a más antiguo por año
        filteredPubs.sort((a, b) => b.year - a.year);

        // Limitar: Solo las 10 primeras
        const top10Pubs = filteredPubs.slice(0, 10);

        // Limpiar el mensaje de "Loading..."
        container.innerHTML = '';

        if (top10Pubs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic">No recent journal publications found.</p>';
            return;
        }

        // Generar e inyectar el HTML para cada publicación (Estilo adaptado para el perfil)
        top10Pubs.forEach(pub => {
            const html = `
            <div class="p-5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md hover:border-brand-200 transition-all">
              <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                
                <div class="sm:w-24 flex-shrink-0">
                  <span class="block text-xl font-bold text-gray-400">${pub.year}</span>
                  <span class="inline-block px-2 py-0.5 mt-1 text-xs font-bold text-green-700 bg-green-100 rounded uppercase">
                    ${pub.badge || 'Jour'}
                  </span>
                </div>
                
                <div class="flex-grow">
                  <h3 class="text-base font-bold text-gray-900 leading-snug">${pub.title}</h3>
                  <p class="text-sm text-gray-600 mt-2">${pub.authorsDisplay}</p>
                  <p class="text-sm text-gray-500 italic mt-1 font-serif">${pub.venue}</p>
                  
                  ${pub.doi || pub.url ? `
                  <div class="mt-3 flex gap-3">
                    ${pub.doi ? `<a href="${pub.doi.startsWith('http') ? pub.doi : 'https://doi.org/' + pub.doi}" target="_blank" class="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"><i class="fa-solid fa-link mr-1"></i>DOI</a>` : ''}
                    ${pub.url ? `<a href="${pub.url}" target="_blank" class="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"><i class="fa-solid fa-file-pdf mr-1"></i>URL / PDF</a>` : ''}
                  </div>
                  ` : ''}
                </div>

              </div>
            </div>
          `;
            container.insertAdjacentHTML('beforeend', html);
        });

    } catch (error) {
        console.error("Error cargando las publicaciones del perfil:", error);
        container.innerHTML = '<p class="text-red-500 italic text-sm">Error loading publications. Please try again later.</p>';
    }
}

// Ejecutar la función
loadPublications();