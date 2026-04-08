// ============================================
// SISTEMA DE MODAIS (substitui prompt/confirm)
// ============================================

function mostrarConfirm(titulo, mensagem, callbackSim, callbackNao = null) {
    let modal = document.getElementById('modalConfirm');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalConfirm'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
    modal.innerHTML = `
        <div class="modal-content modal-pequeno">
            <div class="modal-header"><h2>${titulo}</h2></div>
            <div class="modal-body">
                <p style="color:#94a3b8;margin-bottom:24px;line-height:1.6;">${mensagem}</p>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharModalConfirm(false)">Cancelar</button>
                    <button class="btn-perigo" onclick="fecharModalConfirm(true)">Confirmar</button>
                </div>
            </div>
        </div>`;
    modal._callbackSim = callbackSim;
    modal._callbackNao = callbackNao;
    modal.style.display = 'flex';
    // Clique no overlay (fora do modal) cancela
    modal.onclick = e => { if (e.target === modal) fecharModalConfirm(false); };
}

function fecharModalConfirm(confirmado) {
    const modal = document.getElementById('modalConfirm');
    if (!modal) return;
    modal.style.display = 'none';
    if (confirmado && modal._callbackSim) modal._callbackSim();
    else if (!confirmado && modal._callbackNao) modal._callbackNao();
}

function mostrarPrompt(titulo, label, valorPadrao, tipo, callback) {
    let modal = document.getElementById('modalPrompt');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalPrompt'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
    modal.innerHTML = `
        <div class="modal-content modal-pequeno">
            <div class="modal-header">
                <h2>${titulo}</h2>
                <button class="btn-fechar" onclick="fecharModalPrompt(false)">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>${label}</label>
                    <input type="${tipo || 'text'}" id="promptInput" value="${valorPadrao || ''}" placeholder="${label}">
                </div>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharModalPrompt(false)">Cancelar</button>
                    <button class="btn-salvar" onclick="fecharModalPrompt(true)">✅ Confirmar</button>
                </div>
            </div>
        </div>`;
    modal._callback = callback;
    modal.style.display = 'flex';
    // Clique no overlay cancela
    modal.onclick = e => { if (e.target === modal) fecharModalPrompt(false); };
    setTimeout(() => {
        const inp = document.getElementById('promptInput');
        if (inp) { inp.focus(); inp.select(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') fecharModalPrompt(true); if (e.key === 'Escape') fecharModalPrompt(false); }); }
    }, 50);
}

function fecharModalPrompt(confirmado) {
    const modal = document.getElementById('modalPrompt');
    if (!modal) return;
    const valor = document.getElementById('promptInput')?.value;
    modal.style.display = 'none';
    if (confirmado && modal._callback) modal._callback(valor);
}

// ============================================
// TEMA CLARO/ESCURO
// ============================================

function alternarTema() {
    document.body.classList.toggle('tema-claro');
    const tema = document.body.classList.contains('tema-claro') ? 'claro' : 'escuro';
    document.getElementById('iconeTema').textContent = tema === 'claro' ? '☀️' : '🌙';
    localStorage.setItem('tema', tema);
}

function carregarTema() {
    if (localStorage.getItem('tema') === 'claro') {
        document.body.classList.add('tema-claro');
        document.getElementById('iconeTema').textContent = '☀️';
    }
}

// ============================================
// NOTIFICAÇÕES PUSH (Service Worker)
// ============================================

async function inicializarNotificacoesPush() {
    const usuario = buscarUsuarioAtual();
    const pushHabilitado = usuario?.config?.pushNotificacoes;

    const btn = document.getElementById('btnNotificacoes');
    if (!btn) return;

    if (!('Notification' in window)) {
        btn.style.display = 'none';
        return;
    }

    if (Notification.permission === 'granted' && pushHabilitado) {
        btn.innerHTML = '🔔 Notificações Ativas';
        btn.classList.add('notif-ativa');
    } else {
        btn.innerHTML = '🔕 Ativar Notificações';
        btn.classList.remove('notif-ativa');
    }
}

async function toggleNotificacoesPush() {
    if (!('Notification' in window)) {
        mostrarNotificacao('❌ Seu navegador não suporta notificações', 'erro');
        return;
    }

    const usuario = buscarUsuarioAtual();
    const pushAtivo = usuario?.config?.pushNotificacoes;

    if (pushAtivo && Notification.permission === 'granted') {
        // Desativar
        if (!usuario.config) usuario.config = {};
        usuario.config.pushNotificacoes = false;
        atualizarUsuarioAtual(usuario);
        inicializarNotificacoesPush();
        mostrarNotificacao('🔕 Notificações desativadas', 'info');
        return;
    }

    // Solicitar permissão
    const permissao = await Notification.requestPermission();
    if (permissao === 'granted') {
        if (!usuario.config) usuario.config = {};
        usuario.config.pushNotificacoes = true;
        atualizarUsuarioAtual(usuario);
        inicializarNotificacoesPush();
        enviarNotificacaoPush('🎉 Notificações ativadas!', 'Você será avisado quando um orçamento estiver próximo do limite.');
        mostrarNotificacao('🔔 Notificações ativadas!', 'sucesso');
    } else {
        mostrarNotificacao('❌ Permissão negada. Ative nas configurações do navegador.', 'alerta');
    }
}

function enviarNotificacaoPush(titulo, corpo, icone = '💰') {
    const usuario = buscarUsuarioAtual();
    if (!usuario?.config?.pushNotificacoes) return;
    if (Notification.permission !== 'granted') return;

    new Notification(titulo, {
        body: corpo,
        icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%236366f1'/%3E%3Ctext x='50' y='65' font-size='50' text-anchor='middle' fill='white'%3E${icone}%3C/text%3E%3C/svg%3E`,
        badge: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%236366f1'/%3E%3C/svg%3E`
    });
}

// ============================================
// BUSCA, FILTRO E ORDENAÇÃO — COMBINADOS
// ============================================

// Estado compartilhado dos filtros ativos
const _filtrosAtivos = {
    termo: '',
    periodo: '',
    ordenacao: 'data-desc'
};

// Debounce para não disparar a cada tecla
let _debounceSearch = null;

function buscarGastos() {
    clearTimeout(_debounceSearch);
    _debounceSearch = setTimeout(() => {
        _filtrosAtivos.termo = (document.getElementById('buscaGasto')?.value || '').toLowerCase().trim();
        paginaAtual = 1;
        _aplicarFiltrosCombinados();
    }, 200);
}

// ============================================
// FILTRO POR PERÍODO
// ============================================

function filtrarPorPeriodo() {
    _filtrosAtivos.periodo = document.getElementById('filtroPeriodo')?.value || '';
    paginaAtual = 1;
    _aplicarFiltrosCombinados();
}

// ============================================
// ORDENAÇÃO
// ============================================

function ordenarGastos() {
    _filtrosAtivos.ordenacao = document.getElementById('ordenacao')?.value || 'data-desc';
    paginaAtual = 1;
    _aplicarFiltrosCombinados();
}

/**
 * Aplica termo de busca + período + ordenação de uma vez.
 * Substitui as três funções independentes que se sobrescreviam.
 */
function _aplicarFiltrosCombinados() {
    const usuario = buscarUsuarioAtual();
    if (!usuario) return;

    let gastos = [...usuario.gastos];

    // 1. Filtrar por período
    if (_filtrosAtivos.periodo) {
        const [ano, mes] = _filtrosAtivos.periodo.split('-').map(Number);
        gastos = gastos.filter(g => {
            const d = new Date(g.data);
            return d.getFullYear() === ano && (d.getMonth() + 1) === mes;
        });
    }

    // 2. Filtrar por termo de busca
    if (_filtrosAtivos.termo) {
        gastos = gastos.filter(g =>
            g.nome.toLowerCase().includes(_filtrosAtivos.termo) ||
            g.categoria.toLowerCase().includes(_filtrosAtivos.termo)
        );
    }

    // 3. Ordenar
    switch (_filtrosAtivos.ordenacao) {
        case 'data-desc':    gastos.sort((a, b) => new Date(b.data) - new Date(a.data)); break;
        case 'data-asc':     gastos.sort((a, b) => new Date(a.data) - new Date(b.data)); break;
        case 'valor-desc':   gastos.sort((a, b) => b.valor - a.valor); break;
        case 'valor-asc':    gastos.sort((a, b) => a.valor - b.valor); break;
        case 'categoria':    gastos.sort((a, b) => a.categoria.localeCompare(b.categoria)); break;
    }

    exibirGastos(gastos);
}

// ============================================
// EDITAR GASTOS
// ============================================

function editarGasto(indice) {
    const usuario = buscarUsuarioAtual();
    const gasto = usuario.gastos[indice];
    let modal = document.getElementById('modalEditar');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalEditar'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
    const cats = ['Alimentação','Transporte','Moradia','Saúde','Lazer','Educação','Outros'];
    modal.innerHTML = `
        <div class="modal-content modal-pequeno">
            <div class="modal-header"><h2>✏️ Editar Gasto</h2><button class="btn-fechar" onclick="fecharModalEditar()">✕</button></div>
            <div class="modal-body">
                <div class="form-group"><label>Descrição</label><input type="text" id="editDesc" value="${gasto.nome}"></div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" id="editValor" value="${gasto.valor}" step="0.01" min="0.01"></div>
                <div class="form-group"><label>Categoria</label>
                    <select id="editCategoria">${cats.map(c => `<option ${gasto.categoria===c?'selected':''}>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group"><label><input type="checkbox" id="editRecorrente" ${gasto.recorrente?'checked':''} onchange="toggleFrequenciaEdit()" style="width:auto;margin-right:8px"> Gasto Recorrente</label></div>
                <div class="form-group" id="grupoFrequenciaEdit" style="display:${gasto.recorrente?'block':'none'}">
                    <label>Frequência</label>
                    <select id="editFrequencia">
                        <option value="mensal" ${gasto.frequencia==='mensal'?'selected':''}>Mensal</option>
                        <option value="semanal" ${gasto.frequencia==='semanal'?'selected':''}>Semanal</option>
                        <option value="anual" ${gasto.frequencia==='anual'?'selected':''}>Anual</option>
                    </select>
                </div>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharModalEditar()">Cancelar</button>
                    <button class="btn-salvar" onclick="salvarEdicaoGasto(${indice})">💾 Salvar</button>
                </div>
            </div>
        </div>`;
    modal.style.display = 'flex';
}

function toggleFrequenciaEdit() { const g = document.getElementById('grupoFrequenciaEdit'); if (g) g.style.display = document.getElementById('editRecorrente').checked ? 'block' : 'none'; }
function fecharModalEditar() { const m = document.getElementById('modalEditar'); if (m) m.style.display = 'none'; }

function salvarEdicaoGasto(indice) {
    const desc = document.getElementById('editDesc').value.trim();
    const valorStr = document.getElementById('editValor').value;
    const categoria = document.getElementById('editCategoria').value;
    const recorrente = document.getElementById('editRecorrente').checked;
    const frequencia = document.getElementById('editFrequencia')?.value || 'mensal';
    if (!desc) { mostrarNotificacao('❌ Descrição vazia!', 'erro'); return; }
    if (!validarValor(valorStr)) { mostrarNotificacao('❌ Valor inválido!', 'erro'); return; }
    const usuario = buscarUsuarioAtual();
    usuario.gastos[indice] = { ...usuario.gastos[indice], nome: desc, valor: parseFloat(valorStr), categoria, recorrente, frequencia: recorrente ? frequencia : null };
    atualizarUsuarioAtual(usuario);
    fecharModalEditar();
    atualizarDashboard();
    mostrarNotificacao('✅ Gasto atualizado!', 'sucesso');
}

// ============================================
// EXIBIR GASTOS (AUXILIAR)
// ============================================

function exibirGastos(gastos) {
    if (gastos.length === 0) {
        document.getElementById('listaGastos').innerHTML = '<p class="lista-vazia">Nenhum gasto encontrado</p>';
        document.getElementById('paginacao').innerHTML = '';
        return;
    }
    renderizarPagina(gastos, paginaAtual);
}

// ============================================
// METAS MENSAIS
// ============================================

function definirMeta() {
    const metaAtual = buscarMetaMes(chaveMesAtual());
    mostrarPrompt('🎯 Meta de Economia', 'Valor da meta mensal (R$)', metaAtual?.valor || '', 'number', val => {
        if (!val) return;
        const meta = parseFloat(val);
        if (isNaN(meta) || meta <= 0) { mostrarNotificacao('❌ Valor inválido!', 'erro'); return; }
        salvarMetaMes(chaveMesAtual(), meta);
        atualizarMeta();
        mostrarNotificacao(`🎯 Meta de ${formatarDinheiro(meta)} definida!`, 'sucesso');
        enviarNotificacaoPush('🎯 Meta definida!', `Meta de economia de ${formatarDinheiro(meta)} definida para este mês.`);
    });
}

function atualizarMeta() {
    const usuario = buscarUsuarioAtual();
    const metaObj = buscarMetaMes(chaveMesAtual());
    const meta = metaObj?.valor || usuario.meta || 0;

    const el = document.getElementById('metaConteudo');
    if (!el) return;

    if (meta === 0) {
        el.innerHTML = `<p style="color:#94a3b8;text-align:center;padding:8px 0">Defina uma meta para este mês!</p>`;
        return;
    }

    const salario = buscarSalarioMes(chaveMesAtual());
    const totalGastos = buscarGastosMes(chaveMesAtual()).reduce((s,g) => s+g.valor, 0);
    const economia = salario - totalGastos;
    const progresso = Math.min((economia / meta) * 100, 100);
    const falta = Math.max(meta - economia, 0);

    let cor = '#10b981', msg = '';
    if (progresso >= 100) {
        cor = '#10b981'; msg = '🎉 Meta atingida! Parabéns!';
        if (!usuario.metaNotificada) {
            mostrarNotificacao('🎉 Você atingiu sua meta!', 'sucesso');
            enviarNotificacaoPush('🎉 Meta Atingida!', `Parabéns! Você atingiu sua meta de ${formatarDinheiro(meta)}!`);
            const u = buscarUsuarioAtual(); u.metaNotificada = true; atualizarUsuarioAtual(u);
        }
    } else if (progresso >= 75) { cor = '#10b981'; msg = `💪 Faltam ${formatarDinheiro(falta)}!`; }
    else if (progresso >= 50) { cor = '#6366f1'; msg = '📊 Metade do caminho!'; }
    else if (progresso >= 25) { cor = '#f59e0b'; msg = '💡 Continue economizando!'; }
    else { cor = '#ef4444'; msg = '⚠️ Atenção aos gastos!'; }

    // Contar meses atingidos no histórico
    const historico = buscarHistoricoMetas(12);
    const atingidas = historico.filter(h => h.atingida && !h.mesAtual).length;
    const totalHist = historico.filter(h => !h.mesAtual).length;
    const streakInfo = totalHist > 0
        ? `<span style="color:#94a3b8;font-size:11px">📈 ${atingidas}/${totalHist} meses atingidos</span>`
        : '';

    el.innerHTML = `
        <div class="meta-valor">${formatarDinheiro(meta)}</div>
        <div class="barra-progresso"><div class="progresso" style="width:${progresso}%;background:${cor}"></div></div>
        <div class="meta-info"><span>${msg}</span><span><strong>${progresso.toFixed(0)}%</strong></span></div>
        <div class="meta-info" style="margin-top:8px">
            <span>Economizado: ${formatarDinheiro(economia)}</span>
            <span>Falta: ${formatarDinheiro(falta)}</span>
        </div>
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
            ${streakInfo}
            <button onclick="abrirHistoricoMetas()" style="background:transparent;border:1px solid #334155;color:#94a3b8;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.color='#f1f5f9'" onmouseout="this.style.color='#94a3b8'">
                📋 Ver histórico
            </button>
        </div>`;
}

// ============================================
// HISTÓRICO DE METAS — MODAL
// ============================================

function abrirHistoricoMetas() {
    const historico = buscarHistoricoMetas(12);

    let modal = document.getElementById('modalHistoricoMetas');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalHistoricoMetas';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    // Calcular estatísticas gerais
    const passados = historico.filter(h => !h.mesAtual);
    const atingidas = passados.filter(h => h.atingida).length;
    const taxaSucesso = passados.length > 0 ? Math.round((atingidas / passados.length) * 100) : 0;
    const melhorEconomia = passados.length > 0 ? Math.max(...passados.map(h => h.economia)) : 0;

    const linhas = historico.length === 0
        ? `<p style="color:#94a3b8;text-align:center;padding:30px">Nenhuma meta registrada ainda.<br>Defina sua primeira meta!</p>`
        : historico.map(h => {
            const progresso = Math.min((h.economia / h.valor) * 100, 100);
            const atingida = h.economia >= h.valor;
            const cor = atingida ? '#10b981' : '#ef4444';
            const badge = h.mesAtual
                ? `<span class="badge-mes-atual">Mês atual</span>`
                : atingida
                    ? `<span class="badge-atingida">✓ Atingida</span>`
                    : `<span class="badge-nao-atingida">✗ Não atingida</span>`;

            return `
            <div class="hist-meta-item">
                <div class="hist-meta-header">
                    <div>
                        <span class="hist-meta-mes">${h.nomeMes}</span>
                        ${badge}
                    </div>
                    <span class="hist-meta-valor" style="color:${cor}">${formatarDinheiro(h.economia)}<small> / ${formatarDinheiro(h.valor)}</small></span>
                </div>
                <div class="orcamento-barra-bg" style="margin:8px 0 4px">
                    <div class="orcamento-barra" style="width:${progresso}%;background:${cor}"></div>
                </div>
                <div class="hist-meta-rodape">
                    <span>Gasto: ${formatarDinheiro(h.totalGasto)}</span>
                    <span>Salário: ${formatarDinheiro(h.salario)}</span>
                    <span>${progresso.toFixed(0)}% da meta</span>
                </div>
            </div>`;
        }).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📋 Histórico de Metas</h2>
                <button class="btn-fechar" onclick="fecharHistoricoMetas()">✕</button>
            </div>
            <div class="modal-body">
                ${passados.length > 0 ? `
                <div class="hist-meta-resumo">
                    <div class="hist-resumo-card">
                        <div class="hist-resumo-num" style="color:#10b981">${atingidas}</div>
                        <div class="hist-resumo-label">Meses atingidos</div>
                    </div>
                    <div class="hist-resumo-card">
                        <div class="hist-resumo-num" style="color:#6366f1">${taxaSucesso}%</div>
                        <div class="hist-resumo-label">Taxa de sucesso</div>
                    </div>
                    <div class="hist-resumo-card">
                        <div class="hist-resumo-num" style="color:#f59e0b">${formatarDinheiro(melhorEconomia)}</div>
                        <div class="hist-resumo-label">Melhor economia</div>
                    </div>
                </div>` : ''}
                <div style="max-height:420px;overflow-y:auto;margin-top:4px">
                    ${linhas}
                </div>
                <div class="modal-botoes" style="margin-top:16px">
                    <button class="btn-secundario" onclick="fecharHistoricoMetas()">Fechar</button>
                </div>
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function fecharHistoricoMetas() {
    const m = document.getElementById('modalHistoricoMetas');
    if (m) m.style.display = 'none';
}

// ============================================
// NOTIFICAÇÕES IN-APP
// ============================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('notificacoes');
    if (!container) return;
    const id = Date.now();
    let titulo = { info: 'Informação', sucesso: 'Sucesso', alerta: 'Atenção', erro: 'Erro' }[tipo] || 'Informação';
    const el = document.createElement('div');
    el.className = `notificacao ${tipo}`;
    el.id = `notif-${id}`;
    el.innerHTML = `<div class="notificacao-titulo">${titulo}</div><div class="notificacao-texto">${mensagem}</div>`;
    container.appendChild(el);
    setTimeout(() => {
        const e = document.getElementById(`notif-${id}`);
        if (e) { e.style.opacity = '0'; e.style.transform = 'translateX(400px)'; setTimeout(() => e.remove(), 300); }
    }, 4000);
}

function verificarAlertas() {
    const usuario = buscarUsuarioAtual();
    const salario = buscarSalarioMes(chaveMesAtual());
    if (!salario) return;
    const totalGastos = buscarGastosMes(chaveMesAtual()).reduce((s,g) => s+g.valor, 0);
    const pct = (totalGastos / salario) * 100;

    if (pct > 80 && !sessionStorage.getItem('alertaGastosAltos')) {
        mostrarNotificacao('⚠️ Gastos acima de 80% do salário!', 'alerta');
        enviarNotificacaoPush('⚠️ Alerta de Gastos!', `Seus gastos atingiram ${pct.toFixed(0)}% do salário este mês.`);
        sessionStorage.setItem('alertaGastosAltos', 'true');
    }

    // Alertas de orçamento por categoria
    const uso = calcularUsoOrcamentos();
    Object.entries(uso).forEach(([cat, { percentual, limite }]) => {
        if (percentual >= 100 && !sessionStorage.getItem(`limite-${cat}`)) {
            mostrarNotificacao(`🔴 Limite de ${cat} atingido!`, 'erro');
            enviarNotificacaoPush('🔴 Orçamento Esgotado!', `Você atingiu o limite de ${formatarDinheiro(limite)} em ${cat}.`);
            sessionStorage.setItem(`limite-${cat}`, 'true');
        } else if (percentual >= 80 && !sessionStorage.getItem(`alerta80-${cat}`)) {
            mostrarNotificacao(`⚠️ ${cat}: 80% do orçamento usado`, 'alerta');
            enviarNotificacaoPush('⚠️ Orçamento Quase Esgotado', `${cat}: ${percentual.toFixed(0)}% do orçamento utilizado.`);
            sessionStorage.setItem(`alerta80-${cat}`, 'true');
        }
    });
}

// ============================================
// UTILITÁRIOS
// ============================================

function formatarData(d) { return new Date(d).toLocaleDateString('pt-BR'); }
function validarValor(v) { const n = parseFloat(v); return !isNaN(n) && n > 0 && n < 1000000; }

// ============================================
// HISTÓRICO DE SALÁRIOS
// ============================================

function abrirHistoricoSalarios() {
    const usuario = buscarUsuarioAtual();
    const salariosMensais = usuario.salariosMensais || {};

    let modal = document.getElementById('modalSalarios');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalSalarios'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }

    // Gerar últimos 12 meses
    const meses = [];
    const hoje = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const nomeMes = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        meses.push({ chave, nomeMes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) });
    }

    const campos = meses.map(({ chave, nomeMes }) => `
        <div class="form-group">
            <label>${nomeMes}</label>
            <input type="number" id="sal_${chave}" value="${salariosMensais[chave] !== undefined ? salariosMensais[chave] : (usuario.salario || '')}" step="0.01" min="0" placeholder="Ex: 3500.00">
        </div>`).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💰 Salários por Mês</h2>
                <button class="btn-fechar" onclick="fecharHistoricoSalarios()">✕</button>
            </div>
            <div class="modal-body">
                <div class="orcamento-aviso">
                    💡 Defina seu salário líquido de cada mês. Ideal para renda variável (freelancers, comissões).
                    Meses em branco usarão o valor do salário global.
                </div>
                <div class="grid-dois-col">
                    ${campos}
                </div>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharHistoricoSalarios()">Cancelar</button>
                    <button class="btn-salvar" onclick="salvarTodosSalarios()">💾 Salvar Todos</button>
                </div>
            </div>
        </div>`;
    modal.style.display = 'flex';
}

function fecharHistoricoSalarios() { const m = document.getElementById('modalSalarios'); if (m) m.style.display = 'none'; }

function salvarTodosSalarios() {
    const usuario = buscarUsuarioAtual();
    if (!usuario.salariosMensais) usuario.salariosMensais = {};
    const hoje = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const val = parseFloat(document.getElementById(`sal_${chave}`)?.value || 0);
        if (!isNaN(val) && val > 0) usuario.salariosMensais[chave] = val;
    }
    // Atualizar salário padrão para o mês atual
    const mesAtual = chaveMesAtual();
    if (usuario.salariosMensais[mesAtual]) {
        usuario.salario = usuario.salariosMensais[mesAtual];
        document.getElementById('campoSalario').value = usuario.salario;
    }
    atualizarUsuarioAtual(usuario);
    fecharHistoricoSalarios();
    atualizarDashboard();
    mostrarNotificacao('✅ Salários salvos com sucesso!', 'sucesso');
}

/**
 * Limpa todos os filtros ativos e volta para a lista completa
 */
function limparFiltros() {
    _filtrosAtivos.termo = '';
    _filtrosAtivos.periodo = '';
    _filtrosAtivos.ordenacao = 'data-desc';

    const busca = document.getElementById('buscaGasto');
    const periodo = document.getElementById('filtroPeriodo');
    const ordenacao = document.getElementById('ordenacao');
    if (busca) busca.value = '';
    if (periodo) periodo.value = '';
    if (ordenacao) ordenacao.value = 'data-desc';

    paginaAtual = 1;
    atualizarListaGastos();
}

// ============================================
// ESCAPE KEY — fecha qualquer modal aberto
// ============================================

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const modaisVisiveis = document.querySelectorAll('.modal-overlay[style*="flex"]');
    if (modaisVisiveis.length === 0) return;
    // Fecha o modal mais ao topo (último no DOM)
    const ultimo = modaisVisiveis[modaisVisiveis.length - 1];
    ultimo.style.display = 'none';
    // Limpa estado de cadastro pendente se o modal de nome for fechado
    if (ultimo.id === 'modalNome' && typeof _pendingRegistration !== 'undefined') {
        // eslint-disable-next-line no-undef
        _pendingRegistration = null;
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

function inicializarMelhorias() {
    carregarTema();
    atualizarMeta();
    verificarAlertas();
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const fp = document.getElementById('filtroPeriodo');
    if (fp) {
        fp.value = mesAtual;
        // Sincroniza o estado interno com o valor inicial do input
        _filtrosAtivos.periodo = mesAtual;
    }
    console.log('✅ Melhorias inicializadas');
}
