// Esperar a que el HTML termine de cargar
document.addEventListener('DOMContentLoaded', () => {

    // Ruta al archivo JSON con los alumnos
    // const jsonFile = 'phd_students.json'; 
    // obtener el parámetro 'type' de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const member = urlParams.get('member');

    // Construir la ruta dinámicamente
    const jsonPath = `/profiles/${member}/assets/phd-graduated.json`; // Usamos backticks (`) para insertar la variable

    // console.log("El valor de 'member' capturado de la URL es:", member);

    // Seleccionar el contenedor donde inyectaremos los datos
    const listContainer = document.getElementById('phd-graduated-list');

    // console.log("La ruta del archivo JSON que vamos a leer es:", jsonPath);

    // Hacer la petición para leer el archivo
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Convertir la respuesta a JSON
        })
        .then(students => {
            // Limpiar el mensaje de "Loading..."
            listContainer.innerHTML = '';

            // Recorrer el array de estudiantes y crear el HTML
            students.forEach(student => {
                const li = document.createElement('li');

                // Usamos backticks (`) para poder inyectar las variables fácilmente
                li.innerHTML = `
              <strong>${student.nombre}</strong>
              <p class="text-gray-500 ml-5">"${student.titulo}", graduated in ${student.año}.</p>
            `;

                // Añadir el elemento <li> a la lista <ul>
                listContainer.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading PhD students:', error);
            listContainer.innerHTML = '<li class="text-red-500 list-none">Error loading data.</li>';
        });
});

