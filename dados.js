// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioAtual = null;
let graficoGastos = null;
let graficoDistribuicao = null;

// ============================================
// FUNÇÕES DE ARMAZENAMENTO DE DADOS
// ============================================

/**
 * Busca todos os usuários do localStorage
 */
function buscarTodosUsuarios() {
    const dados = localStorage.getItem('usuarios');
    return dados ? JSON.parse(dados) : {};
}

/**
 * Salva todos os usuários no localStorage
 */
function salvarTodosUsuarios(usuarios) {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

/**
 * Busca dados do usuário atual
 */
function buscarUsuarioAtual() {
    const usuarios = buscarTodosUsuarios();
    return usuarios[usuarioAtual] || null;
}

/**
 * Atualiza dados do usuário atual
 */
function atualizarUsuarioAtual(novosValores) {
    const usuarios = buscarTodosUsuarios();
    usuarios[usuarioAtual] = { 
        ...usuarios[usuarioAtual], 
        ...novosValores 
    };
    salvarTodosUsuarios(usuarios);
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

/**
 * Criar nova conta de usuário
 */
function criarConta() {
    // Pegar valores dos campos
    const email = document.getElementById('campoEmail').value.trim();
    const senha = document.getElementById('campoSenha').value.trim();

    // Validar campos
    if (!email || !senha) {
        alert('❌ Preencha email e senha!');
        return;
    }

    // Pedir nome do usuário
    const nome = prompt('Digite seu nome completo:');
    if (!nome || !nome.trim()) {
        alert('❌ Nome é obrigatório!');
        return;
    }

    // Verificar se email já existe
    const usuarios = buscarTodosUsuarios();
    if (usuarios[email]) {
        alert('❌ Este email já está cadastrado!');
        return;
    }

    // Criar novo usuário
    usuarios[email] = {
        nome: nome.trim(),
        senha: senha,
        salario: 0,
        gastos: []
    };

    // Salvar no localStorage
    salvarTodosUsuarios(usuarios);
    alert('✅ Conta criada com sucesso!');

    // Fazer login automático
    usuarioAtual = email;
    localStorage.setItem('usuarioLogado', email);
    mostrarDashboard();
}

/**
 * Fazer login
 */
function fazerLogin() {
    // Pegar valores dos campos
    const email = document.getElementById('campoEmail').value.trim();
    const senha = document.getElementById('campoSenha').value.trim();

    // Validar campos
    if (!email || !senha) {
        alert('❌ Preencha email e senha!');
        return;
    }

    // Buscar usuários
    const usuarios = buscarTodosUsuarios();

    // Verificar se usuário existe
    if (!usuarios[email]) {
        alert('❌ Usuário não encontrado!');
        return;
    }

    // Verificar senha
    if (usuarios[email].senha !== senha) {
        alert('❌ Senha incorreta!');
        return;
    }

    // Login bem-sucedido
    usuarioAtual = email;
    localStorage.setItem('usuarioLogado', email);
    mostrarDashboard();
}

/**
 * Sair da conta
 */
function sair() {
    usuarioAtual = null;
    localStorage.removeItem('usuarioLogado');
    
    // Mostrar tela de login
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('telaDashboard').style.display = 'none';
    
    // Limpar campos
    document.getElementById('campoEmail').value = '';
    document.getElementById('campoSenha').value = '';
}

/**
 * Verificar se há usuário logado ao carregar página
 */
function verificarAutoLogin() {
    const emailSalvo = localStorage.getItem('usuarioLogado');
    if (emailSalvo) {
        const usuarios = buscarTodosUsuarios();
        if (usuarios[emailSalvo]) {
            usuarioAtual = emailSalvo;
            mostrarDashboard();
        }
    }
}

/**
 * Mostrar tela do dashboard
 */
function mostrarDashboard() {
    // Esconder login e mostrar dashboard
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('telaDashboard').style.display = 'block';

    // Buscar dados do usuário
    const usuario = buscarUsuarioAtual();
    
    // Atualizar nome no cabeçalho
    document.getElementById('nomeUsuario').textContent = usuario.nome;
    
    // Preencher campo de salário
    document.getElementById('campoSalario').value = usuario.salario || 0;

    // Criar gráficos
    criarGraficos();
    
    // Atualizar tudo
    atualizarDashboard();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Executar quando página carregar
 */
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema carregado');
    verificarAutoLogin();
    
    // Adicionar listener para campo de salário
    document.getElementById('campoSalario').addEventListener('change', function() {
        const salario = parseFloat(this.value) || 0;
        const usuario = buscarUsuarioAtual();
        usuario.salario = salario;
        atualizarUsuarioAtual(usuario);
        atualizarDashboard();
    });
});