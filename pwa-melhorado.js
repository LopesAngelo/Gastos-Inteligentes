// ============================================
// PWA - PROGRESSIVE WEB APP MELHORADO
// ============================================

let deferredPrompt = null;

/**
 * Detectar plataforma do usuário
 */
function detectarPlataforma() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
    }
    
    // Android
    if (/android/i.test(userAgent)) {
        return 'android';
    }
    
    // Desktop
    return 'desktop';
}

/**
 * Verificar se já está instalado
 */
function estaInstalado() {
    // PWA instalado (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // iOS standalone
    if (window.navigator.standalone === true) {
        return true;
    }
    
    return false;
}

/**
 * Inicializar PWA
 */
function inicializarPWA() {
    registrarServiceWorker();
    monitorarPromptInstalacao();
    monitorarConexao();
    
    // Mostrar botão de instalação se não estiver instalado
    if (!estaInstalado()) {
        setTimeout(adicionarBotaoInstalar, 2000); // Espera 2 segundos
    } else {
        console.log('✅ App já instalado');
    }
    
    console.log('📱 PWA inicializado');
}

/**
 * Registrar Service Worker
 */
async function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker registrado');
        } catch (error) {
            console.error('❌ Erro Service Worker:', error);
        }
    }
}

/**
 * Monitorar evento de instalação (Android/Desktop)
 */
function monitorarPromptInstalacao() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        mostrarBotaoInstalacao();
    });
    
    // Detectar quando foi instalado
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA instalado!');
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('🎉 App instalado com sucesso!', 'sucesso');
        }
        deferredPrompt = null;
        
        // Remover botão de instalação
        const btn = document.getElementById('btnInstalarPWA');
        if (btn) btn.remove();
    });
}

/**
 * Adicionar botão de instalação no cabeçalho
 */
function adicionarBotaoInstalar() {
    // Verificar se já existe
    if (document.getElementById('btnInstalarPWA')) return;
    
    const btn = document.createElement('button');
    btn.id = 'btnInstalarPWA';
    btn.className = 'btn-instalar-pwa';
    btn.innerHTML = '📲 Instalar App';
    btn.onclick = mostrarModalInstalacao;
    
    const cabecalho = document.querySelector('.cabecalho div');
    if (cabecalho) {
        cabecalho.insertBefore(btn, cabecalho.firstChild);
    }
    
    console.log('📲 Botão de instalação adicionado');
}

/**
 * Mostrar botão de instalação (chamado pelo evento)
 */
function mostrarBotaoInstalacao() {
    adicionarBotaoInstalar();
}

/**
 * Mostrar modal com instruções de instalação
 */
function mostrarModalInstalacao() {
    const plataforma = detectarPlataforma();
    
    let modal = document.getElementById('modalInstalacao');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalInstalacao';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    let conteudo = '';
    
    if (plataforma === 'android' && deferredPrompt) {
        // Android com suporte nativo
        conteudo = `
            <div class="modal-content modal-instalacao">
                <div class="modal-header">
                    <h2>📲 Instalar App</h2>
                    <button class="btn-fechar" onclick="fecharModalInstalacao()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="icone-instalacao">📱</div>
                    <h3>Instale o Gastos Inteligente</h3>
                    <p>Instale nosso app em seu Android para:</p>
                    <ul class="beneficios-pwa">
                        <li>✅ Acesso rápido direto da tela inicial</li>
                        <li>✅ Funcionar offline</li>
                        <li>✅ Notificações de economia</li>
                        <li>✅ Experiência de app nativo</li>
                    </ul>
                    <button class="btn-instalar-grande" onclick="instalarAppAndroid()">
                        📲 Instalar Agora
                    </button>
                </div>
            </div>
        `;
    } else if (plataforma === 'ios') {
        // iOS - instruções manuais
        conteudo = `
            <div class="modal-content modal-instalacao">
                <div class="modal-header">
                    <h2>📲 Instalar no iPhone/iPad</h2>
                    <button class="btn-fechar" onclick="fecharModalInstalacao()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="icone-instalacao">🍎</div>
                    <h3>Como Instalar no iOS</h3>
                    <div class="passos-instalacao">
                        <div class="passo">
                            <div class="numero-passo">1</div>
                            <div class="texto-passo">
                                <strong>Toque no botão Compartilhar</strong>
                                <p>Ícone <strong>📤</strong> na barra inferior do Safari</p>
                            </div>
                        </div>
                        <div class="passo">
                            <div class="numero-passo">2</div>
                            <div class="texto-passo">
                                <strong>Adicionar à Tela Inicial</strong>
                                <p>Role a lista e toque em "Adicionar à Tela Inicial"</p>
                            </div>
                        </div>
                        <div class="passo">
                            <div class="numero-passo">3</div>
                            <div class="texto-passo">
                                <strong>Confirme</strong>
                                <p>Toque em "Adicionar" no canto superior direito</p>
                            </div>
                        </div>
                    </div>
                    <p class="nota-ios">⚠️ <strong>Importante:</strong> Use o Safari para instalação (não funciona no Chrome iOS)</p>
                </div>
            </div>
        `;
    } else {
        // Desktop ou Android sem suporte (mostrar instruções Chrome)
        conteudo = `
            <div class="modal-content modal-instalacao">
                <div class="modal-header">
                    <h2>📲 Instalar App</h2>
                    <button class="btn-fechar" onclick="fecharModalInstalacao()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="icone-instalacao">💻</div>
                    <h3>Como Instalar</h3>
                    <div class="passos-instalacao">
                        <div class="passo">
                            <div class="numero-passo">1</div>
                            <div class="texto-passo">
                                <strong>Menu do Navegador</strong>
                                <p>Clique no menu (⋮) no canto superior direito</p>
                            </div>
                        </div>
                        <div class="passo">
                            <div class="numero-passo">2</div>
                            <div class="texto-passo">
                                <strong>Instalar App</strong>
                                <p>Selecione "Instalar Gastos Inteligente..."</p>
                            </div>
                        </div>
                        <div class="passo">
                            <div class="numero-passo">3</div>
                            <div class="texto-passo">
                                <strong>Confirme</strong>
                                <p>Clique em "Instalar" na janela que aparecer</p>
                            </div>
                        </div>
                    </div>
                    <p class="nota-desktop">💡 <strong>Dica:</strong> Funciona melhor no Chrome ou Edge</p>
                    ${deferredPrompt ? '<button class="btn-instalar-grande" onclick="instalarAppAndroid()">📲 Instalar Agora</button>' : ''}
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = conteudo;
    modal.style.display = 'flex';
}

/**
 * Instalar app Android (via prompt nativo)
 */
async function instalarAppAndroid() {
    if (!deferredPrompt) {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('❌ Erro ao instalar. Tente pelo menu do navegador.', 'erro');
        }
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('🎉 App instalado com sucesso!', 'sucesso');
            }
            fecharModalInstalacao();
        } else {
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('ℹ️ Instalação cancelada', 'info');
            }
        }
        
        deferredPrompt = null;
    } catch (error) {
        console.error('Erro ao instalar:', error);
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('❌ Erro ao instalar', 'erro');
        }
    }
}

/**
 * Fechar modal de instalação
 */
function fecharModalInstalacao() {
    const modal = document.getElementById('modalInstalacao');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Monitorar conexão
 */
function monitorarConexao() {
    window.addEventListener('online', () => {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('🌐 Online!', 'sucesso');
        }
        if (typeof sincronizarTudo === 'function') {
            sincronizarTudo();
        }
    });
    
    window.addEventListener('offline', () => {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('🔴 Modo offline', 'alerta');
        }
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPWA);
} else {
    inicializarPWA();
}
