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
    const qs = new URLSearchParams({ action: 'list', deviceToken: deviceToken });
    const res = await fetch(`${API_URL}?${qs.toString()}`);
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

async function loadAll(showLoading = true) {
    const msgStatus = document.getElementById('loading-status');
    const photoStatus = document.getElementById('photo-loading-status');
    if (showLoading) {
        if (msgStatus) msgStatus.innerText = 'Carregando...';
        if (photoStatus) photoStatus.innerText = 'Carregando...';
    }
    try {
        const data = await apiList();
        messages = data.messages || [];
        photos = data.photos || [];
        renderMessages();
        renderPhotos();
    } catch (err) {
        console.error(err);
        if (msgStatus) msgStatus.innerText = 'Erro ao sincronizar';
        if (photoStatus) photoStatus.innerText = 'Erro ao sincronizar';
    }
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
            ? `<button onclick="deleteMessage('${msg.id}')" title="Apagar meu recado" class="text-[10px] text-rose-200 bg-rose-600/30 hover:bg-rose-600 px-2 py-1 rounded-full border border-rose-400/30 transition inline-flex items-center gap-1">
                    <i class="fas fa-trash-alt"></i> Apagar
               </button>`
            : `<span class="text-[9px] sm:text-[10px] text-rose-300/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">Convidado(a)</span>`;

        card.innerHTML = `
            <div class="flex items-center justify-between">
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

        const deleteBtn = photo.isOwner ? `
            <button onclick="deletePhoto('${photo.id}')" title="Apagar minha foto" class="absolute top-2 right-2 bg-black/60 hover:bg-rose-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs backdrop-blur-md transition shadow-lg z-10">
                <i class="fas fa-trash-alt"></i>
            </button>
        ` : '';

        card.innerHTML = `
            ${deleteBtn}
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

// Enviar Mensagem
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

// Enviar Foto
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

    const file = fileInput.files[0];
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processando Imagem...`;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result; // Data URL
        try {
            statusDiv.innerText = "Salvando no Google Drive...";
            await apiPost({
                action: 'createPhoto',
                author: author,
                caption: caption,
                imageBase64: base64Data,
                mimeType: file.type,
                fileName: file.name
            });
            await loadAll(false);
            if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            closePhotoModal();
            document.getElementById('photo-form').reset();
            statusDiv.innerText = "";
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar foto: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-upload"></i> Publicar Foto no Mural`;
        }
    };
    reader.readAsDataURL(file);
};

// Apagar Mensagem
window.deleteMessage = async function(id) {
    if (!confirm("Tem certeza que deseja apagar seu recado?")) return;
    try {
        await apiPost({ action: 'deleteMessage', id: id });
        await loadAll(false);
    } catch (err) {
        alert("Erro ao apagar mensagem: " + err.message);
    }
};

// Apagar Foto
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