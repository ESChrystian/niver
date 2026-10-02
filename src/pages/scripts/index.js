// Token único por dispositivo para gerenciar mensagens e fotos próprias
let deviceToken = localStorage.getItem('birthday_device_token');
if (!deviceToken) {
    deviceToken = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('birthday_device_token', deviceToken);
}

// Data do Aniversário (03/10/2026 00:00:00) e Nascimento (03/10/2005 08:00:00)
const targetBirthday = new Date(2026, 9, 3, 0, 0, 0).getTime(); 
const birthDate = new Date(2005, 9, 3, 8, 0, 0).getTime();

let celebrationTriggered = false;

function updateCountdowns() {
    const now = new Date().getTime();
    const distance = targetBirthday - now;

    if (distance <= 0) {
        if (!celebrationTriggered) {
            celebrationTriggered = true;
            document.getElementById('countdown-content')?.classList.add('hidden');
            document.getElementById('birthday-celebration-banner')?.classList.remove('hidden');
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
            }
        }
    } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (document.getElementById('days')) document.getElementById('days').innerText = String(days).padStart(2, '0');
        if (document.getElementById('hours')) document.getElementById('hours').innerText = String(hours).padStart(2, '0');
        if (document.getElementById('minutes')) document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
        if (document.getElementById('seconds')) document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
    }

    const lifeDistance = now - birthDate;
    if (lifeDistance > 0) {
        if (document.getElementById('life-years')) document.getElementById('life-years').innerText = Math.floor(lifeDistance / (1000 * 60 * 60 * 24 * 365.25));
        if (document.getElementById('life-days')) document.getElementById('life-days').innerText = Math.floor(lifeDistance / (1000 * 60 * 60 * 24)).toLocaleString('pt-BR');
        if (document.getElementById('life-hours')) document.getElementById('life-hours').innerText = Math.floor(lifeDistance / (1000 * 60 * 60)).toLocaleString('pt-BR');
        if (document.getElementById('life-seconds')) document.getElementById('life-seconds').innerText = Math.floor(lifeDistance / 1000).toLocaleString('pt-BR');
    }
}

setInterval(updateCountdowns, 1000);
updateCountdowns();

// Escape para segurança XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Modais
window.openModal = () => document.getElementById('message-modal')?.classList.remove('hidden');
window.closeModal = () => document.getElementById('message-modal')?.classList.add('hidden');
window.openPhotoModal = () => document.getElementById('photo-modal')?.classList.remove('hidden');
window.closePhotoModal = () => document.getElementById('photo-modal')?.classList.add('hidden');

// API - Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxFy3GCM9f5ChFnSDrvxd5QmAl1N1uD3NsGY3t53yJ5nKtJ_FKjDCWBPPwwXDxaZibc_Q/exec';

let messages = [];
let photos = [];

async function apiList() {
    // _t + no-store: impede o navegador de reutilizar uma resposta antiga
    const qs = new URLSearchParams({ action: 'list', deviceToken: deviceToken, _t: Date.now() });
    const res = await fetch(`${API_URL}?${qs.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Erro ao carregar dados.');
    return data;
}

async function apiPost(payload) {
    // Sem cabeçalho Content-Type para evitar o pré-flight CORS (OPTIONS)
    const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ ...payload, deviceToken: deviceToken })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Erro ao salvar.');
    return data;
}

/* ---------------- Sincronização com a planilha ----------------
   - busca de novo a cada POLL_MS (só com a aba visível)
   - busca ao voltar para a aba / voltar a ficar online
   - só redesenha quando algo mudou (sem piscar a tela)
   - nunca roda duas buscas ao mesmo tempo; se pedirem uma durante outra, refaz em seguida */
const POLL_MS = 15000;
let lastSignature = '';
let isLoading = false;
let reloadQueued = false;

async function loadAll(showLoading = true) {
    if (isLoading) { reloadQueued = true; return; }
    isLoading = true;
    const msgStatus = document.getElementById('loading-status');
    const photoStatus = document.getElementById('photo-loading-status');
    if (showLoading) {
        if (msgStatus) msgStatus.innerText = 'Carregando...';
        if (photoStatus) photoStatus.innerText = 'Carregando...';
    }
    try {
        const data = await apiList();
        const newMessages = data.messages || [];
        const newPhotos = data.photos || [];
        const signature = JSON.stringify([newMessages, newPhotos]);
        if (signature !== lastSignature) {
            lastSignature = signature;
            messages = newMessages;
            photos = newPhotos;
            renderMessages();
            renderPhotos();
        } else if (showLoading) {
            if (msgStatus) msgStatus.innerText = `${messages.length} recado(s)`;
            if (photoStatus) photoStatus.innerText = `${photos.length} foto(s)`;
        }
    } catch (err) {
        console.error(err);
        if (msgStatus) msgStatus.innerText = 'Erro ao sincronizar';
        if (photoStatus) photoStatus.innerText = 'Erro ao sincronizar';
    } finally {
        isLoading = false;
        if (reloadQueued) { reloadQueued = false; loadAll(false); }
    }
}

setInterval(() => { if (!document.hidden) loadAll(false); }, POLL_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadAll(false); });
window.addEventListener('online', () => loadAll(false));

/* ---------------- Cards ---------------- */
function ownerButtons(editFn, deleteFn, id, what) {
    return `
        <div class="owner-actions">
            <button type="button" class="owner-btn edit" onclick="${editFn}('${escapeHtml(id)}')" title="Editar ${what}">
                <i class="fas fa-pen"></i>${what === 'recado' ? ' Editar' : ''}
            </button>
            <button type="button" class="owner-btn del" onclick="${deleteFn}('${escapeHtml(id)}')" title="Apagar ${what}">
                <i class="fas fa-trash-alt"></i>${what === 'recado' ? ' Apagar' : ''}
            </button>
        </div>`;
}

function renderMessages() {
    const grid = document.getElementById('messages-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (messages.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full glass-card p-6 rounded-2xl text-center text-rose-300/70 text-xs italic">
                Nenhum recado ainda. Seja o primeiro a deixar uma mensagem de carinho!
            </div>
        `;
        document.getElementById('loading-status').innerText = '0 recado(s)';
        return;
    }

    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = "message-card p-5 sm:p-6 rounded-2xl space-y-3 relative overflow-hidden glass-card";

        const badge = msg.isOwner
            ? ownerButtons('editMessage', 'deleteMessage', msg.id, 'recado')
            : `<span class="text-[9px] sm:text-[10px] text-rose-300/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">Convidado(a)</span>`;

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <h4 class="font-playfair font-bold text-rose-200 text-sm sm:text-base flex items-center gap-2">
                    <i class="fas fa-user-circle text-rose-400"></i> ${escapeHtml(msg.author)}
                </h4>
                ${badge}
            </div>
            <p class="text-rose-100/90 text-xs sm:text-sm leading-relaxed italic">
                "${escapeHtml(msg.text)}"
            </p>
        `;
        grid.appendChild(card);
    });
    document.getElementById('loading-status').innerText = `${messages.length} recado(s)`;
}

function renderPhotos() {
    const grid = document.getElementById('photos-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (photos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full glass-card p-6 rounded-2xl text-center text-rose-300/70 text-xs italic">
                Nenhuma foto enviada ainda. Seja o primeiro a enviar uma foto especial!
            </div>
        `;
        document.getElementById('photo-loading-status').innerText = `0 fotos`;
        return;
    }

    photos.forEach(photo => {
        const card = document.createElement('div');
        card.className = "photo-card rounded-2xl overflow-hidden flex flex-col justify-between relative group glass-card";

        const actions = photo.isOwner ? ownerButtons('editPhoto', 'deletePhoto', photo.id, 'foto') : '';

        card.innerHTML = `
            ${actions}
            <div class="h-48 sm:h-56 w-full overflow-hidden bg-black/40 flex items-center justify-center">
                <img src="${escapeHtml(photo.url)}" alt="Foto de ${escapeHtml(photo.author)}"
                    class="w-full h-full object-cover hover:scale-105 transition duration-500"
                    onerror="this.src='https://placehold.co/400x300/2a122e/fce7f3?text=Foto+Indispon%C3%ADvel'">
            </div>
            <div class="p-4 space-y-1 bg-black/30">
                <h4 class="font-playfair font-bold text-rose-200 text-sm flex items-center gap-2">
                    <i class="fas fa-camera text-rose-400"></i> ${escapeHtml(photo.author)}
                </h4>
                <p class="text-rose-100/80 text-xs italic">${escapeHtml(photo.caption)}</p>
            </div>
        `;
        grid.appendChild(card);
    });
    document.getElementById('photo-loading-status').innerText = `${photos.length} foto(s)`;
}

/* ---------------- Imagem: reduz antes de enviar ----------------
   Fotos de celular têm vários MB; reduzir deixa o envio rápido e evita falha no Apps Script. */
function prepareImage(file, maxSide = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.onload = () => {
            const original = { dataUrl: reader.result, mimeType: file.type, fileName: file.name };
            const img = new Image();
            img.onerror = () => resolve(original); // formato que o navegador não desenha: envia como está
            img.onload = () => {
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({
                    dataUrl: canvas.toDataURL('image/jpeg', quality),
                    mimeType: 'image/jpeg',
                    fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg'
                });
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ---------------- Enviar ---------------- */
window.submitMessage = async function(event) {
    event.preventDefault();
    const nameInput = document.getElementById('author-name').value.trim();
    const textInput = document.getElementById('author-message').value.trim();
    const btn = document.getElementById('submit-btn');

    if (!nameInput || !textInput) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enviando...`;

    try {
        await apiPost({ action: 'createMessage', author: nameInput, text: textInput });
        await loadAll(false);
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        closeModal();
        document.getElementById('message-form').reset();
    } catch (err) {
        console.error(err);
        alert("Erro ao salvar mensagem: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-paper-plane"></i> Enviar Mensagem para o Mural`;
    }
};

window.submitPhoto = async function(event) {
    event.preventDefault();
    const author = document.getElementById('photo-author').value.trim();
    const caption = document.getElementById('photo-caption').value.trim();
    const fileInput = document.getElementById('photo-file-input');
    const btn = document.getElementById('photo-submit-btn');
    const statusDiv = document.getElementById('photo-upload-status');

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Selecione uma imagem!");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processando Imagem...`;
    try {
        const img = await prepareImage(fileInput.files[0]);
        statusDiv.innerText = "Salvando no Google Drive...";
        await apiPost({
            action: 'createPhoto',
            author: author,
            caption: caption,
            imageBase64: img.dataUrl,
            mimeType: img.mimeType,
            fileName: img.fileName
        });
        await loadAll(false);
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        closePhotoModal();
        document.getElementById('photo-form').reset();
        statusDiv.innerText = "";
    } catch (err) {
        console.error(err);
        statusDiv.innerText = "";
        alert("Erro ao enviar foto: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-upload"></i> Publicar Foto no Mural`;
    }
};

/* ---------------- Editar (recado ou foto) ---------------- */
const INPUT_CLS = 'w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-100 placeholder-rose-300/30 focus:outline-none focus:border-rose-500 transition';
const LABEL_CLS = 'block text-xs uppercase tracking-wider text-rose-300/80 font-medium mb-1';
let editing = null; // { type: 'message' | 'photo', id }

function ensureEditModal() {
    let modal = document.getElementById('edit-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[10050] flex items-center justify-center p-4 hidden';
    modal.innerHTML = `
        <div class="glass-card max-w-md w-full p-6 rounded-3xl space-y-5 relative shadow-2xl border border-rose-500/30 max-h-[92vh] overflow-y-auto">
            <div class="flex justify-between items-center">
                <h3 id="edit-title" class="font-playfair text-lg sm:text-xl font-bold text-rose-200 flex items-center gap-2"></h3>
                <button type="button" onclick="closeEditModal()" class="text-rose-300/60 hover:text-rose-200 text-lg p-1"><i class="fas fa-times"></i></button>
            </div>
            <form id="edit-form" onsubmit="submitEdit(event)" class="space-y-4">
                <div>
                    <label class="${LABEL_CLS}">Nome</label>
                    <input type="text" id="edit-author" required class="${INPUT_CLS}">
                </div>
                <div id="edit-text-wrap">
                    <label id="edit-text-label" class="${LABEL_CLS}"></label>
                    <textarea id="edit-text" rows="4" required class="${INPUT_CLS} resize-none"></textarea>
                </div>
                <div id="edit-photo-wrap" class="hidden space-y-2">
                    <img id="edit-photo-preview" alt="" class="w-full max-h-48 object-cover rounded-xl border border-rose-500/20">
                    <label class="${LABEL_CLS}">Trocar foto (opcional)</label>
                    <input type="file" id="edit-photo-file" accept="image/*"
                        class="w-full bg-black/30 border border-rose-500/20 rounded-xl px-3 py-2.5 text-xs text-rose-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white cursor-pointer">
                </div>
                <div id="edit-status" class="text-xs text-center text-rose-300 font-medium"></div>
                <div class="flex gap-3">
                    <button type="button" onclick="closeEditModal()" class="flex-1 py-3 rounded-xl border border-rose-500/30 text-rose-200 text-sm font-semibold hover:bg-white/5 transition">Cancelar</button>
                    <button type="submit" id="edit-save-btn" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-semibold text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2">
                        <i class="fas fa-check"></i> Salvar
                    </button>
                </div>
            </form>
        </div>`;
    document.body.appendChild(modal);
    return modal;
}

function openEdit(type, id) {
    const item = (type === 'message' ? messages : photos).find(x => String(x.id) === String(id));
    if (!item) return;
    editing = { type, id: item.id };
    ensureEditModal();
    document.getElementById('edit-author').value = item.author || '';
    document.getElementById('edit-status').innerText = '';
    const isPhoto = type === 'photo';
    document.getElementById('edit-title').innerHTML = isPhoto
        ? '<i class="fas fa-pen text-rose-400"></i> Editar Foto'
        : '<i class="fas fa-pen text-rose-400"></i> Editar Recado';
    document.getElementById('edit-text-label').innerText = isPhoto ? 'Legenda da Foto' : 'Sua Mensagem';
    document.getElementById('edit-text').value = isPhoto ? (item.caption || '') : (item.text || '');
    document.getElementById('edit-photo-wrap').classList.toggle('hidden', !isPhoto);
    if (isPhoto) {
        document.getElementById('edit-photo-preview').src = item.url;
        document.getElementById('edit-photo-file').value = '';
    }
    document.getElementById('edit-modal').classList.remove('hidden');
}

window.editMessage = (id) => openEdit('message', id);
window.editPhoto = (id) => openEdit('photo', id);
window.closeEditModal = function() {
    document.getElementById('edit-modal')?.classList.add('hidden');
    editing = null;
};

window.submitEdit = async function(event) {
    event.preventDefault();
    if (!editing) return;
    const author = document.getElementById('edit-author').value.trim();
    const text = document.getElementById('edit-text').value.trim();
    const btn = document.getElementById('edit-save-btn');
    const status = document.getElementById('edit-status');
    if (!author || !text) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Salvando...`;
    try {
        if (editing.type === 'message') {
            await apiPost({ action: 'updateMessage', id: editing.id, author, text });
        } else {
            const payload = { action: 'updatePhoto', id: editing.id, author, caption: text };
            const file = document.getElementById('edit-photo-file').files[0];
            if (file) {
                status.innerText = 'Enviando a nova foto...';
                const img = await prepareImage(file);
                Object.assign(payload, { imageBase64: img.dataUrl, mimeType: img.mimeType, fileName: img.fileName });
            }
            await apiPost(payload);
        }
        await loadAll(false);
        closeEditModal();
    } catch (err) {
        console.error(err);
        status.innerText = '';
        alert('Erro ao salvar alteração: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-check"></i> Salvar`;
    }
};

/* ---------------- Apagar ---------------- */
window.deleteMessage = async function(id) {
    if (!confirm("Tem certeza que deseja apagar seu recado?")) return;
    try {
        await apiPost({ action: 'deleteMessage', id: id });
        await loadAll(false);
    } catch (err) {
        alert("Erro ao apagar mensagem: " + err.message);
    }
};

window.deletePhoto = async function(id) {
    if (!confirm("Tem certeza que deseja apagar sua foto?")) return;
    try {
        await apiPost({ action: 'deletePhoto', id: id });
        await loadAll(false);
    } catch (err) {
        alert("Erro ao apagar foto: " + err.message);
    }
};

// Carregar ao iniciar
document.addEventListener('DOMContentLoaded', () => loadAll());
