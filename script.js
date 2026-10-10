const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '✕' : '☰';
});
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.textContent = '☰';
}));

const search = document.querySelector('#resource-search');
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.resource-card')];
const noResults = document.querySelector('#no-results');
let activeFilter = 'All';
function updateResources() {
  const term = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const category = card.dataset.category || '';
    const matchesFilter = activeFilter === 'All' || category === activeFilter;
    const matchesText = card.textContent.toLowerCase().includes(term);
    const show = matchesFilter && matchesText;
    card.hidden = !show;
    if (show) visible++;
  });
  if (noResults) noResults.hidden = visible !== 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter || 'All';
  filters.forEach(item => item.classList.toggle('active', item === button));
  updateResources();
}));
search?.addEventListener('input', updateResources);
document.querySelector('#year').textContent = new Date().getFullYear();
