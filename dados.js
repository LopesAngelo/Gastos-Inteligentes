// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioAtual = null;
let graficoGastos = null;
let graficoDistribuicao = null;
let graficoEvolucao = null;

// ============================================
// REGRA 50-30-20 — MAPEAMENTO OFICIAL
// Método de Elizabeth Warren
// ============================================
const REGRA_503020 = {
    necessidades: {
        label: 'Necessidades',
        categorias: ['Moradia', 'Alimentação', 'Transporte', 'Saúde'],
        meta: 50,
        cor: '#ef4444',
        icone: '🏠',
        descricao: 'Moradia, alimentação, transporte e saúde'
    },
    desejos: {
        label: 'Desejos',
        categorias: ['Lazer', 'Outros'],
        meta: 30,
        cor: '#f59e0b',
        icone: '🎉',
        descricao: 'Lazer, assinaturas, hobbies e compras não essenciais'
    },
    futuro: {
        label: 'Futuro',
        categorias: ['Educação'],
        meta: 20,
        cor: '#10b981',
        icone: '📈',
        descricao: 'Educação, poupança e reserva de emergência'
    }
};

/**
 * Calcular distribuição 50-30-20 real a partir das categorias
 */
function calcular503020(gastos, salario) {
    if (!salario || salario === 0) return { necessidades: 0, desejos: 0, futuro: 0, poupanca: 0 };

    const totais = { necessidades: 0, desejos: 0, futuro: 0 };

    gastos.forEach(g => {
        for (const [grupo, config] of Object.entries(REGRA_503020)) {
            if (config.categorias.includes(g.categoria)) {
                totais[grupo] += g.valor;
                break;
            }
        }
    });

    const totalGasto = Object.values(totais).reduce((a, b) => a + b, 0);
    const poupanca = Math.max(salario - totalGasto, 0);

    return {
        necessidades: (totais.necessidades / salario) * 100,
        desejos: (totais.desejos / salario) * 100,
        futuro: ((totais.futuro + poupanca) / salario) * 100,
        poupanca: (poupanca / salario) * 100,
        valoresAbsolutos: {
            necessidades: totais.necessidades,
            desejos: totais.desejos,
            futuro: totais.futuro,
            poupanca
        }
    };
}

// ============================================
// SEGURANÇA — HASH DE SENHA (SHA-256)
// ============================================
async function hashSenha(senha) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(senha));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isHashSHA256(str) { return str && str.length === 64 && /^[0-9a-f]+$/.test(str); }

async function verificarSenha(digitada, armazenada, email) {
    if (isHashSHA256(armazenada)) return await hashSenha(digitada) === armazenada;
    if (digitada === armazenada) {
        const us = buscarTodosUsuarios();
        if (us[email]) { us[email].senha = await hashSenha(digitada); salvarTodosUsuarios(us); }
        return true;
    }
    return false;
}

// ============================================
// SALÁRIO MENSAL VARIÁVEL
// ============================================
function chaveMesAtual() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

function buscarSalarioMes(chave) {
    const u = buscarUsuarioAtual();
    if (!u) return 0;
    return (u.salariosMensais && u.salariosMensais[chave] !== undefined)
        ? u.salariosMensais[chave] : (u.salario || 0);
}

function salvarSalarioMes(chave, valor) {
    const u = buscarUsuarioAtual();
    if (!u.salariosMensais) u.salariosMensais = {};
    u.salariosMensais[chave] = valor;
    u.salario = valor; // padrão para meses sem registro
    atualizarUsuarioAtual(u);
}

function buscarGastosMes(chave) {
    const u = buscarUsuarioAtual();
    if (!u) return [];
    return u.gastos.filter(g => {
        const d = new Date(g.data);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === chave;
    });
}

// ============================================
// ORÇAMENTO POR CATEGORIA
// ============================================
function buscarOrcamentos() { return buscarUsuarioAtual()?.orcamentos || {}; }

function salvarOrcamentoCategoria(categoria, limite) {
    const u = buscarUsuarioAtual();
    if (!u.orcamentos) u.orcamentos = {};
    if (limite <= 0) { delete u.orcamentos[categoria]; }
    else { u.orcamentos[categoria] = limite; }
    atualizarUsuarioAtual(u);
}

function calcularUsoOrcamentos() {
    const orcamentos = buscarOrcamentos();
    const gastosMes = buscarGastosMes(chaveMesAtual());
    const porCat = {};
    gastosMes.forEach(g => { porCat[g.categoria] = (porCat[g.categoria] || 0) + g.valor; });

    const resultado = {};
    Object.entries(orcamentos).forEach(([cat, limite]) => {
        const gasto = porCat[cat] || 0;
        resultado[cat] = { limite, gasto, percentual: limite > 0 ? (gasto / limite) * 100 : 0, falta: Math.max(limite - gasto, 0) };
    });
    return resultado;
}

// ============================================
// METAS MENSAIS
// ============================================

/**
 * Buscar meta de um mês específico
 */
function buscarMetaMes(chave) {
    const u = buscarUsuarioAtual();
    return u?.metas?.[chave] || null;
}

/**
 * Salvar/encerrar meta do mês com resultado real
 */
function registrarResultadoMeta(chave) {
    const u = buscarUsuarioAtual();
    const meta = u?.metas?.[chave];
    if (!meta || meta.encerrada) return;

    const gastos = buscarGastosMes(chave);
    const salario = buscarSalarioMes(chave);
    const totalGasto = gastos.reduce((s, g) => s + g.valor, 0);
    const economia = salario - totalGasto;

    if (!u.metas) u.metas = {};
    u.metas[chave] = {
        ...meta,
        salario,
        totalGasto,
        economia,
        atingida: economia >= meta.valor,
        encerrada: true
    };
    atualizarUsuarioAtual(u);
}

/**
 * Salvar meta do mês atual
 */
function salvarMetaMes(chave, valor) {
    const u = buscarUsuarioAtual();
    if (!u.metas) u.metas = {};
    // Preservar resultado se já encerrada
    const anterior = u.metas[chave];
    u.metas[chave] = {
        ...(anterior || {}),
        valor,
        encerrada: false,
        atingida: false,
        criadaEm: anterior?.criadaEm || new Date().toISOString()
    };
    // Retrocompatibilidade: manter campo .meta também
    u.meta = valor;
    u.metaNotificada = false;
    atualizarUsuarioAtual(u);
}

/**
 * Retorna histórico de metas dos últimos N meses
 */
function buscarHistoricoMetas(meses = 12) {
    const u = buscarUsuarioAtual();
    const hoje = new Date();
    const resultado = [];

    for (let i = 0; i < meses; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const nomeMes = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

        const meta = u?.metas?.[chave];
        if (meta) {
            // Calcular resultado real se não encerrado
            const gastos = buscarGastosMes(chave);
            const salario = buscarSalarioMes(chave);
            const totalGasto = gastos.reduce((s, g) => s + g.valor, 0);
            const economia = salario - totalGasto;

            resultado.push({
                chave,
                nomeMes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
                valor: meta.valor,
                economia,
                salario,
                totalGasto,
                atingida: economia >= meta.valor,
                mesAtual: chave === chaveMesAtual()
            });
        }
    }

    return resultado;
}

// ============================================
// ARMAZENAMENTO
// ============================================
function buscarTodosUsuarios() { const d = localStorage.getItem('usuarios'); return d ? JSON.parse(d) : {}; }
function salvarTodosUsuarios(u) { localStorage.setItem('usuarios', JSON.stringify(u)); }
function buscarUsuarioAtual() { return buscarTodosUsuarios()[usuarioAtual] || null; }
function atualizarUsuarioAtual(v) {
    const us = buscarTodosUsuarios();
    us[usuarioAtual] = { ...us[usuarioAtual], ...v };
    salvarTodosUsuarios(us);
}

// ============================================
// AUTENTICAÇÃO
// ============================================

// Guarda temporariamente os dados do cadastro pendente
// para NÃO expor a senha no atributo onclick do HTML.
let _pendingRegistration = null;

function criarConta() {
    const email = document.getElementById('campoEmail').value.trim();
    const senha = document.getElementById('campoSenha').value.trim();
    if (!email || !senha) { mostrarNotificacao('❌ Preencha email e senha!', 'erro'); return; }
    if (senha.length < 6) { mostrarNotificacao('❌ Senha mínimo 6 caracteres!', 'erro'); return; }
    if (!validarEmail(email)) { mostrarNotificacao('❌ Email inválido!', 'erro'); return; }
    mostrarModalNome(email, senha);
}

function mostrarModalNome(email, senha) {
    // ✅ SEGURANÇA: senha salva em variável JS, nunca exposta no DOM
    _pendingRegistration = { email, senha };

    let modal = document.getElementById('modalNome');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalNome'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }
    modal.innerHTML = `
        <div class="modal-content modal-pequeno">
            <div class="modal-header"><h2>👤 Criar Conta</h2></div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Seu nome completo</label>
                    <input type="text" id="inputNomeCadastro" placeholder="Ex: João da Silva" autofocus>
                </div>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharModalNome()">Cancelar</button>
                    <button class="btn-salvar" onclick="confirmarCriacaoConta()">✅ Criar Conta</button>
                </div>
            </div>
        </div>`;
    modal.style.display = 'flex';
    setTimeout(() => {
        const inp = document.getElementById('inputNomeCadastro');
        if (inp) {
            inp.focus();
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') confirmarCriacaoConta();
                if (e.key === 'Escape') fecharModalNome();
            });
        }
    }, 80);
}

function fecharModalNome() {
    _pendingRegistration = null;
    const m = document.getElementById('modalNome');
    if (m) m.style.display = 'none';
}

async function confirmarCriacaoConta() {
    const { email, senha } = _pendingRegistration || {};
    if (!email || !senha) { mostrarNotificacao('❌ Sessão expirada. Tente novamente.', 'erro'); return; }

    const nome = document.getElementById('inputNomeCadastro')?.value.trim();
    if (!nome) { mostrarNotificacao('❌ Nome é obrigatório!', 'erro'); return; }
    fecharModalNome();

    const us = buscarTodosUsuarios();
    if (us[email]) { mostrarNotificacao('❌ Email já cadastrado!', 'erro'); return; }
    us[email] = {
        nome, senha: await hashSenha(senha), salario: 0, salariosMensais: {},
        meta: 0, gastos: [], orcamentos: {}, dataCadastro: new Date().toISOString(),
        config: { notificacoes: true, iaAutomatica: true, detectarDuplicatas: true, moeda: 'BRL', pushNotificacoes: false }
    };
    salvarTodosUsuarios(us);
    mostrarNotificacao('✅ Conta criada!', 'sucesso');
    usuarioAtual = email;
    localStorage.setItem('usuarioLogado', email);
    mostrarDashboard();
}

async function fazerLogin() {
    const email = document.getElementById('campoEmail').value.trim();
    const senha = document.getElementById('campoSenha').value.trim();
    if (!email || !senha) { mostrarNotificacao('❌ Preencha email e senha!', 'erro'); return; }
    const us = buscarTodosUsuarios();
    if (!us[email]) { mostrarNotificacao('❌ Usuário não encontrado!', 'erro'); return; }
    if (!await verificarSenha(senha, us[email].senha, email)) { mostrarNotificacao('❌ Senha incorreta!', 'erro'); return; }
    usuarioAtual = email;
    localStorage.setItem('usuarioLogado', email);
    mostrarNotificacao('✅ Bem-vindo de volta!', 'sucesso');
    mostrarDashboard();
}

function sair() {
    usuarioAtual = null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('telaDashboard').style.display = 'none';
    document.getElementById('campoEmail').value = '';
    document.getElementById('campoSenha').value = '';
}

function verificarAutoLogin() {
    const em = localStorage.getItem('usuarioLogado');
    if (em && buscarTodosUsuarios()[em]) { usuarioAtual = em; mostrarDashboard(); }
}

function mostrarDashboard() {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('telaDashboard').style.display = 'block';
    const u = buscarUsuarioAtual();
    document.getElementById('nomeUsuario').textContent = u.nome;
    const salMes = buscarSalarioMes(chaveMesAtual());
    document.getElementById('campoSalario').value = salMes;
    const hoje = new Date();
    const nomeMes = hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const labelEl = document.getElementById('labelSalario');
    if (labelEl) labelEl.textContent = `Salário de ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} (R$)`;
    criarGraficos();
    atualizarDashboard();
    inicializarMelhorias();
    verificarGastosRecorrentes();
    inicializarNotificacoesPush();
}

function validarEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
// validarValor definida em melhorias.js — não duplicar aqui

window.addEventListener('DOMContentLoaded', function () {
    verificarAutoLogin();
    document.getElementById('campoSalario').addEventListener('change', function () {
        const s = parseFloat(this.value) || 0;
        if (s < 0 || s > 1000000) { mostrarNotificacao('❌ Valor inválido!', 'erro'); this.value = buscarSalarioMes(chaveMesAtual()); return; }
        salvarSalarioMes(chaveMesAtual(), s);
        atualizarDashboard();
        mostrarNotificacao(`💰 Salário do mês atualizado!`, 'sucesso');
    });
    document.getElementById('campoSenha').addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
});
