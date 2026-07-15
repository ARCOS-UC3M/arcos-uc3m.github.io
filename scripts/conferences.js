/**
 * @typedef {Object} Conference
 * @property {string} id
 * @property {number} year
 * @property {string} title
 * @property {string} [description]
 * @property {string} url
 * @property {string} deadline - ISO 8601 Date string for the event end date
 * @property {string} [cfpDeadline] - ISO 8601 Date string for the Call for Papers closure
 * @property {string} [theme] - Dynamically injected ('brand' or 'gray')
 * @property {boolean} [isSimple] - Render as a simple list item
 */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('/data/conferences.json');
    if (!response.ok) throw new Error('Failed to load conferences configuration.');
    
    /** @type {Conference[]} */
    const conferences = await response.json();
    
    const now = new Date();
    const upcoming = [];
    const past = [];

    // Categorize and dynamically theme based on the primary event deadline
    conferences.forEach(conf => {
      const deadlineDate = new Date(conf.deadline);
      
      if (deadlineDate >= now) {
        conf.theme = 'brand'; // Automatically apply brand colors to upcoming events
        upcoming.push(conf);
      } else {
        conf.theme = 'gray'; // Automatically apply gray colors to past events
        past.push(conf);
      }
    });

    renderUpcoming(upcoming, now);
    renderPast(past);

  } catch (error) {
    console.error('Error initializing conferences:', error);
  }
});

/**
 * Renders upcoming conferences to the DOM
 * @param {Conference[]} conferences 
 * @param {Date} now - Current system date for state evaluation
 */
function renderUpcoming(conferences, now) {
  const container = document.getElementById('upcoming-conferences-container');
  if (!container) return;

  container.innerHTML = conferences.map(conf => {
    // Dynamic utility class mapping based on the auto-injected theme
    const themeColor = conf.theme === 'brand' ? 'brand-600' : 'gray-600';
    const borderColor = conf.theme === 'brand' ? 'brand-200' : 'gray-200';
    const borderBtn = conf.theme === 'brand' ? 'brand-600' : 'gray-300';
    
    const isCfpActive = conf.cfpDeadline && (new Date(conf.cfpDeadline) >= now);
    const cfpBadge = isCfpActive 
      ? `<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">CFP OPEN</div>` 
      : '';

    return `
      <div class="bg-white rounded-lg border border-${borderColor} shadow-sm hover:shadow-md transition p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        ${cfpBadge}
        <div>
          <div class="text-${themeColor} font-bold text-sm mb-1">${conf.year}</div>
          <h3 class="text-xl font-bold text-gray-900">${conf.title}</h3>
          <p class="text-gray-600">${conf.description || ''}</p>
        </div>
        <a href="${conf.url}" target="_blank" rel="noopener noreferrer"
          class="flex-shrink-0 px-5 py-2 border border-${borderBtn} text-${themeColor} font-medium rounded hover:bg-${themeColor} hover:text-white transition focus:ring-2 focus:ring-offset-2 focus:ring-${themeColor}">
          Visit Website &rarr;
        </a>
      </div>
    `;
  }).join('');
}

/**
 * Renders past conferences to the DOM
 * @param {Conference[]} conferences 
 */
function renderPast(conferences) {
  const container = document.getElementById('past-conferences-container');
  if (!container) return;

  conferences.sort((a, b) => b.year - a.year);

  container.innerHTML = conferences.map(conf => {
    const isLink = conf.url && conf.url !== "#";
    const tag = isLink ? 'a' : 'div';
    
    const linkAttributes = isLink 
      ? `href="${conf.url}" target="_blank" rel="noopener noreferrer"` 
      : '';
      
    const interactiveClasses = isLink 
      ? 'cursor-pointer group hover:bg-gray-50 focus:outline-none focus:bg-gray-50' 
      : 'hover:bg-gray-50';
      
    const titleStyles = isLink 
      ? 'group-hover:text-gray-900 transition-colors' 
      : '';
      
    const icon = isLink 
      ? `<i class="fa-solid fa-arrow-up-right-from-square text-xs ml-2 text-gray-400 group-hover:text-gray-600 transition-colors"></i>` 
      : '';

    return `
      <${tag} ${linkAttributes} class="flex items-center justify-between p-3 rounded transition border-b border-gray-50 ${interactiveClasses}">
        <span class="font-medium text-gray-700 ${titleStyles}">
          ${conf.title} ${icon}
        </span>
        <span class="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">${conf.year}</span>
      </${tag}>
    `;
  }).join('');
}