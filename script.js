const search=document.querySelector('#search');
const resources=[...document.querySelectorAll('.resource')];
const buttons=[...document.querySelectorAll('[data-filter]')];
let filter='all';
function update(){const q=(search?.value||'').toLowerCase().trim();resources.forEach(card=>{const ok=(filter==='all'||card.dataset.category===filter)&&card.innerText.toLowerCase().includes(q);card.classList.toggle('hidden',!ok)});}
search?.addEventListener('input',update);
buttons.forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;buttons.forEach(b=>b.classList.toggle('active',b===btn));update()}));
