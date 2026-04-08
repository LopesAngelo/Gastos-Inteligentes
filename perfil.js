// ============================================
// PERFIL E CONFIGURAÇÕES
// ============================================

function abrirPerfil() {
    const usuario = buscarUsuarioAtual();
    let modal = document.getElementById('modalPerfil');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalPerfil'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }

    const isGoogle = usuario.loginGoogle || usuario.senha === '__google__';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>👤 Perfil do Usuário</h2>
                <button class="btn-fechar" onclick="fecharPerfil()">✕</button>
            </div>
            <div class="modal-body">
                <div class="perfil-info">
                    <div class="avatar">${obterIniciais(usuario.nome)}</div>
                    <div>
                        <h3>${usuario.nome}</h3>
                        <p class="email">${usuario.email || usuarioAtual}</p>
                        <small>
                            ${isGoogle ? '🔵 Conta Google' : '🔒 Conta local'} •
                            Desde ${formatarDataCadastro()}
                        </small>
                    </div>
                </div>

                <div class="perfil-tabs">
                    <button class="tab-btn active" onclick="mostrarAba('dados',event)">📝 Dados</button>
                    ${!isGoogle ? `<button class="tab-btn" onclick="mostrarAba('seguranca',event)">🔒 Senha</button>` : ''}
                    <button class="tab-btn" onclick="mostrarAba('config',event)">⚙️ Config.</button>
                    <button class="tab-btn" onclick="mostrarAba('exportar',event)">📊 Exportar</button>
                </div>

                <!-- DADOS -->
                <div id="aba-dados" class="aba-content active">
                    <h3>Editar Dados</h3>
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" id="editarNome" value="${usuario.nome}">
                    </div>
                    <div class="form-group">
                        <label id="labelSalarioPerfil">Salário do Mês Atual (R$)</label>
                        <input type="number" id="editarSalario" value="${buscarSalarioMes(chaveMesAtual())}" step="0.01" min="0">
                    </div>
                    <button class="btn-salvar" onclick="salvarDados()">💾 Salvar</button>
                </div>

                <!-- SENHA (apenas contas locais) -->
                ${!isGoogle ? `
                <div id="aba-seguranca" class="aba-content">
                    <h3>Alterar Senha</h3>
                    <div class="form-group"><label>Senha Atual</label><input type="password" id="senhaAtual" placeholder="Senha atual"></div>
                    <div class="form-group">
                        <label>Nova Senha</label>
                        <input type="password" id="novaSenha" placeholder="Mínimo 6 caracteres" oninput="verificarForcaSenha()">
                        <div class="senha-forca" id="forcaSenha"></div>
                    </div>
                    <div class="form-group"><label>Confirmar Nova Senha</label><input type="password" id="confirmarSenha" placeholder="Repita a nova senha"></div>
                    <button class="btn-salvar" onclick="alterarSenha()">🔐 Alterar Senha</button>
                </div>` : ''}

                <!-- CONFIGURAÇÕES -->
                <div id="aba-config" class="aba-content">
                    <h3>Preferências</h3>
                    <div class="config-item">
                        <div><strong>🔔 Alertas in-app</strong><p>Avisos de gastos e metas</p></div>
                        <label class="switch"><input type="checkbox" id="configNotificacoes" ${(usuario.config?.notificacoes!==false)?'checked':''} onchange="salvarConfig()"><span class="slider"></span></label>
                    </div>
                    <div class="config-item">
                        <div><strong>🤖 IA Automática</strong><p>Categorizar gastos automaticamente</p></div>
                        <label class="switch"><input type="checkbox" id="configIA" ${(usuario.config?.iaAutomatica!==false)?'checked':''} onchange="salvarConfig()"><span class="slider"></span></label>
                    </div>
                    <div class="config-item">
                        <div><strong>🔍 Detectar Duplicatas</strong><p>Avisar sobre gastos duplicados</p></div>
                        <label class="switch"><input type="checkbox" id="configDuplicatas" ${(usuario.config?.detectarDuplicatas!==false)?'checked':''} onchange="salvarConfig()"><span class="slider"></span></label>
                    </div>
                    <div class="config-item">
                        <div><strong>💱 Moeda</strong><p>Moeda exibida nos valores</p></div>
                        <select id="configMoeda" onchange="salvarConfig()">
                            <option value="BRL" ${(usuario.config?.moeda||'BRL')==='BRL'?'selected':''}>🇧🇷 Real (R$)</option>
                            <option value="USD" ${usuario.config?.moeda==='USD'?'selected':''}>🇺🇸 Dólar ($)</option>
                            <option value="EUR" ${usuario.config?.moeda==='EUR'?'selected':''}>🇪🇺 Euro (€)</option>
                        </select>
                    </div>
                    <hr style="border-color:#334155;margin:20px 0">
                    <button class="btn-secundario" onclick="limparCache()">🗑️ Limpar Cache</button>
                    <button class="btn-perigo" onclick="excluirConta()" style="margin-top:10px">⚠️ Excluir Conta</button>
                </div>

                <!-- EXPORTAR -->
                <div id="aba-exportar" class="aba-content">
                    <h3>Exportar Dados</h3>
                    <p style="color:#94a3b8;margin-bottom:20px">Baixe seus dados financeiros.</p>
                    <button class="btn-salvar" onclick="exportarCSV();fecharPerfil();" style="margin-bottom:10px">📊 Exportar Gastos CSV (Excel)</button>
                    <button class="btn-secundario" onclick="exportarDados()">📁 Backup Completo (JSON)</button>
                    <div style="margin-top:20px;padding:15px;background:#0f172a;border-radius:8px;">
                        <strong style="color:#10b981">📈 Resumo</strong>
                        <p style="margin-top:10px;color:#94a3b8;font-size:14px;">
                            Total de gastos: <strong style="color:#f1f5f9">${buscarUsuarioAtual().gastos.length}</strong><br>
                            Gastos este mês: <strong style="color:#f1f5f9">${buscarGastosMes(chaveMesAtual()).length}</strong><br>
                            Conta criada em: <strong style="color:#f1f5f9">${formatarDataCadastro()}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>`;
    modal.style.display = 'flex';
}

function fecharPerfil() { const m = document.getElementById('modalPerfil'); if (m) m.style.display = 'none'; }

function mostrarAba(aba, event) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.aba-content').forEach(c => c.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');
    const el = document.getElementById(`aba-${aba}`);
    if (el) el.classList.add('active');
}

function obterIniciais(nome) {
    if (!nome) return '??';
    const p = nome.trim().split(' ');
    return p.length === 1 ? p[0].substring(0,2).toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}

function formatarDataCadastro() {
    const u = buscarUsuarioAtual();
    return u?.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
}

function salvarDados() {
    const nome = document.getElementById('editarNome').value.trim();
    const salario = parseFloat(document.getElementById('editarSalario').value);
    if (!nome) { mostrarNotificacao('❌ Nome vazio!', 'erro'); return; }
    if (isNaN(salario) || salario < 0 || salario > 1000000) { mostrarNotificacao('❌ Salário inválido!', 'erro'); return; }
    const u = buscarUsuarioAtual();
    u.nome = nome;
    atualizarUsuarioAtual(u);
    salvarSalarioMes(chaveMesAtual(), salario);
    if (typeof salvarDadosNuvem === 'function') salvarDadosNuvem(u);
    document.getElementById('nomeUsuario').textContent = nome;
    document.getElementById('campoSalario').value = salario;
    atualizarDashboard();
    mostrarNotificacao('✅ Dados atualizados!', 'sucesso');
}

function verificarForcaSenha() {
    const senha = document.getElementById('novaSenha').value;
    const div = document.getElementById('forcaSenha');
    if (!senha) { div.innerHTML = ''; return; }
    let f = 0;
    if (senha.length >= 6) f++;
    if (senha.length >= 10) f++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) f++;
    if (/\d/.test(senha)) f++;
    if (/[^a-zA-Z0-9]/.test(senha)) f++;
    const [txt, cor] = f <= 2 ? ['😟 Fraca','#ef4444'] : f <= 3 ? ['😐 Média','#f59e0b'] : ['😊 Forte','#10b981'];
    div.innerHTML = `<span style="color:${cor}">${txt}</span>`;
}

async function alterarSenha() {
    const atual = document.getElementById('senhaAtual').value;
    const nova  = document.getElementById('novaSenha').value;
    const conf  = document.getElementById('confirmarSenha').value;
    if (!atual || !nova || !conf) { mostrarNotificacao('❌ Preencha todos os campos!', 'erro'); return; }
    if (nova.length < 6) { mostrarNotificacao('❌ Mínimo 6 caracteres!', 'erro'); return; }
    if (nova !== conf) { mostrarNotificacao('❌ Senhas não conferem!', 'erro'); return; }
    const u = buscarUsuarioAtual();
    if (!await verificarSenha(atual, u.senha, usuarioAtual)) { mostrarNotificacao('❌ Senha atual incorreta!', 'erro'); return; }
    u.senha = await hashSenha(nova);
    atualizarUsuarioAtual(u);
    ['senhaAtual','novaSenha','confirmarSenha'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('forcaSenha').innerHTML = '';
    mostrarNotificacao('✅ Senha alterada!', 'sucesso');
}

function salvarConfig() {
    const u = buscarUsuarioAtual();
    if (!u.config) u.config = {};
    u.config.notificacoes     = document.getElementById('configNotificacoes')?.checked ?? true;
    u.config.iaAutomatica     = document.getElementById('configIA')?.checked ?? true;
    u.config.detectarDuplicatas = document.getElementById('configDuplicatas')?.checked ?? true;
    u.config.moeda            = document.getElementById('configMoeda')?.value || 'BRL';
    atualizarUsuarioAtual(u);
    if (typeof salvarDadosNuvem === 'function') salvarDadosNuvem(u);
    mostrarNotificacao('✅ Configurações salvas!', 'sucesso');
}

function exportarDados() {
    const u = buscarUsuarioAtual();
    const blob = new Blob([JSON.stringify({ nome: u.nome, email: usuarioAtual, salario: u.salario, salariosMensais: u.salariosMensais, meta: u.meta, orcamentos: u.orcamentos, gastos: u.gastos, config: u.config, dataExportacao: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-gastos-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacao('📁 Backup exportado!', 'sucesso');
}

function limparCache() {
    mostrarConfirm('🗑️ Limpar Cache', 'Limpa o cache offline do app.<br>Seus dados <strong>NÃO</strong> serão apagados.', async () => {
        if ('caches' in window) { const ns = await caches.keys(); await Promise.all(ns.map(n => caches.delete(n))); }
        if (typeof resetarIA === 'function') resetarIA();
        mostrarNotificacao('🗑️ Cache limpo!', 'sucesso');
    });
}

function excluirConta() {
    mostrarConfirm('⚠️ Excluir Conta', 'Ação <strong>irreversível</strong>!<br>Todos os dados serão apagados permanentemente.', () => {
        mostrarPrompt('⚠️ Confirmação Final', 'Digite EXCLUIR para confirmar', '', 'text', val => {
            if (val !== 'EXCLUIR') { mostrarNotificacao('❌ Confirmação incorreta', 'info'); return; }
            const us = buscarTodosUsuarios();
            delete us[usuarioAtual];
            salvarTodosUsuarios(us);
            localStorage.removeItem('usuarioLogado');
            if (typeof sairFirebase === 'function') sairFirebase();
            mostrarNotificacao('✅ Conta excluída', 'info');
            setTimeout(() => location.reload(), 1500);
        });
    });
}
