/**
 * @typedef {Object} Conference
 * @property {string} id
 * @property {number} year
 * @property {string} title
 * @property {string} url
 * @property {string} deadline - ISO 8601 Date string
 */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('/data/conferences.json');
    if (!response.ok) throw new Error('Failed to load conferences data.');
    
    /** @type {Conference[]} */
    const conferences = await response.json();
    
    // Evaluate upcoming events against the current system time
    const now = new Date();
    const upcoming = conferences.filter(conf => new Date(conf.deadline) >= now);

    const section = document.getElementById('upcoming-events-section');
    const container = document.getElementById('index-upcoming-container');
    
    if (!section || !container) return;

    // Hide the entire section if there are no upcoming events
    if (upcoming.length === 0) {
      section.style.display = 'none';
      section.setAttribute('aria-hidden', 'true');
      return;
    }

    // Reveal the section
    section.style.display = 'block';
    section.setAttribute('aria-hidden', 'false');

    // Aggregate titles for the subtitle text
    const subtitleText = upcoming.map(c => `${c.title} ${c.year}`).join(' & ');

    // Generate buttons dynamically. 
    // The first button gets the primary 'white bg' style, subsequent buttons get the 'border' style.
    const buttonsHtml = upcoming.map((c, index) => {
      const isPrimary = index === 0;
      const btnClass = isPrimary
        ? 'px-5 py-2 bg-white text-brand-900 font-bold rounded shadow hover:bg-gray-100 transition focus:ring-2 focus:ring-offset-2 focus:ring-brand-500'
        : 'px-5 py-2 border border-white text-white font-medium rounded hover:bg-brand-800 transition focus:ring-2 focus:ring-offset-2 focus:ring-white';
        
      return `
        <a target="_blank" href="${c.url}" rel="noopener noreferrer" class="${btnClass}">
          ${c.title} Info
        </a>
      `;
    }).join('');

    // Inject into the DOM matching the original design structure
    container.innerHTML = `
      <div class="text-white">
        <h3 class="text-2xl font-bold mb-2">Upcoming Events</h3>
        <p class="text-brand-100">${subtitleText}</p>
      </div>
      <div class="flex gap-4 flex-wrap">
        ${buttonsHtml}
      </div>
    `;

  } catch (error) {
    console.error('Error rendering upcoming events on index:', error);
  }
});