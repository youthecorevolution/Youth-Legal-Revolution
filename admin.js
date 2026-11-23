import { createClient } from '@supabase/supabase-js';
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anon } = import.meta.env;
const message = document.querySelector('#status-message');
const loginPanel = document.querySelector('#login-panel');
const editorPanel = document.querySelector('#editor-panel');
if (!url || !anon) message.textContent = 'Dashboard is not configured. Add the Supabase project URL and public anon key to the Hostinger environment variables, then rebuild.';
else {
 const db = createClient(url, anon);
 const form = document.querySelector('#content-form');
 const type = document.querySelector('#content-type');
 const list = document.querySelector('#content-list');
 const setStatus = value => { message.textContent = value; };
 async function checkAccess() {
   const { data: { user } } = await db.auth.getUser();
   let authorized = false;
   if (user) {
     const { data, error } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
     authorized = !error && Boolean(data);
     if (!authorized) { await db.auth.signOut(); setStatus('This account is not on the editor access list.'); }
   }
   loginPanel.hidden = authorized;
   editorPanel.hidden = !authorized;
   if (authorized) await refresh();
 }
 async function refresh() {
   const { data, error } = await db.from(type.value).select('*').order('updated_at', { ascending: false });
   list.replaceChildren();
   if (error) { setStatus(`Could not load entries: ${error.message}`); return; }
   for (const item of data || []) {
     const button = document.createElement('button'); button.type = 'button';
     button.textContent = `${item.title} · ${item.status || item.review_status || 'draft'}`;
     button.addEventListener('click', () => populate(item)); list.append(button);
   }
 }
 function toggleFields() {
   const report = type.value === 'reports';
   document.querySelector('#report-fields').hidden = !report;
   document.querySelector('#article-fields').hidden = report;
   form.elements.status.disabled = report;
 }
 function populate(row) {
   form.reset(); form.elements.id.value = row.id;
   for (const field of form.elements) if (field.name && Object.hasOwn(row, field.name)) {
     const value = row[field.name];
     field.value = ['evidence','sources'].includes(field.name) && Array.isArray(value) ? value.map(x => typeof x === 'string' ? x : x.url || JSON.stringify(x)).join('\n') : value ?? '';
   }
   setStatus('Entry loaded. Save when your edits are ready.');
 }
 document.querySelector('#login-form').addEventListener('submit', async event => {
   event.preventDefault(); const data = new FormData(event.currentTarget);
   const { error } = await db.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
   if (error) setStatus(`Sign-in failed: ${error.message}`); else await checkAccess();
 });
 document.querySelector('#sign-out').addEventListener('click', async () => { await db.auth.signOut(); await checkAccess(); });
 document.querySelector('#media-upload').addEventListener('click', async () => {
   const file = document.querySelector('#media-file').files[0]; const alt = document.querySelector('#media-alt').value.trim();
   const out = document.querySelector('#media-result');
   if (!file || !alt) { out.textContent = 'Choose an image and add descriptive alternative text.'; return; }
   if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) { out.textContent = 'Use a JPEG, PNG, WebP or AVIF image up to 5 MB.'; return; }
   const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
   const { error: uploadError } = await db.storage.from('media').upload(path, file, { contentType:file.type, upsert:false });
   if (uploadError) { out.textContent = `Upload failed: ${uploadError.message}`; return; }
   const { error: recordError } = await db.from('media_assets').insert({ object_path:path, alt_text:alt });
   if (recordError) { await db.storage.from('media').remove([path]); out.textContent = `Could not save media record: ${recordError.message}`; return; }
   out.textContent = `Uploaded. Public URL: ${db.storage.from('media').getPublicUrl(path).data.publicUrl}`;
 });
 type.addEventListener('change', () => { toggleFields(); form.reset(); refresh(); });
 form.addEventListener('submit', async event => {
   event.preventDefault(); const data = new FormData(form); const row = Object.fromEntries(data);
   const id = row.id; delete row.id;
   if (type.value === 'reports') {
     row.evidence = row.evidence.split(/\r?\n/).map(note => note.trim()).filter(Boolean);
     row.sources = row.sources.split(/\r?\n/).map(source => source.trim()).filter(Boolean).map(url => ({ url }));
     delete row.category; delete row.excerpt; delete row.body; delete row.status;
     const validSourceLinks = row.sources.every(source => { try { return new URL(source.url).protocol === 'https:'; } catch { return false; } });
     if (row.review_status === 'published' && (!row.verified_findings?.trim() || !row.evidence.length || !row.sources.length || !validSourceLinks || !row.jurisdiction?.trim() || !row.provision_citation?.trim() || !row.reviewer?.trim() || !row.reviewed_at)) {
       setStatus('Before publishing, add verified findings, evidence, HTTPS sources, jurisdiction, a legal citation, reviewer and review date.'); return;
     }
   } else {
     delete row.allegation; delete row.evidence; delete row.sources; delete row.jurisdiction; delete row.provision_citation; delete row.reviewer; delete row.reviewed_at; delete row.legal_analysis; delete row.obligation; delete row.responsible_authority;
     delete row.review_status; delete row.verified_findings; delete row.response;
     if (type.value === 'articles') delete row.summary;
     if (type.value === 'pages') { delete row.summary; delete row.category; delete row.excerpt; }
   }
   row.updated_at = new Date().toISOString();
   if (row.status === 'published') row.published_at = row.updated_at;
   const result = id ? await db.from(type.value).update(row).eq('id', id) : await db.from(type.value).insert(row);
   if (result.error) setStatus(`Save failed: ${result.error.message}`); else { setStatus('Saved.'); form.reset(); await refresh(); }
 });
 db.auth.onAuthStateChange(() => { queueMicrotask(checkAccess); });
 toggleFields(); checkAccess();
}

