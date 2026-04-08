// ============================================
// IA DE CATEGORIZAÇÃO LOCAL
// ============================================

const baseConhecimentoIA = {
    'Alimentação': {
        palavrasChave: [
            'mercado','supermercado','extra','carrefour','pão de açúcar','paodeacucar',
            'assai','assaí','atacadão','atacadao','walmart','sams',"sam's",
            'padaria','açougue','acougue','hortifruti','quitanda','feira','emporio','empório','mercearia',
            'ifood','rappi','uber eats','ubereats','99food','restaurante','lanchonete',
            'pizzaria','hamburgueria','sushi','japonês','japones','churrascaria','sorveteria',
            'mcdonalds',"mcdonald's",'burger king','bk','subway','kfc','pizza hut','dominos',
            'bar','boteco','cervejaria','adega','distribuidora','açaí','acai'
        ], peso: 1.5
    },
    'Transporte': {
        palavrasChave: [
            'uber','99','taxi','cabify','indrive','lyft',
            'gasolina','etanol','alcool','álcool','diesel','gnv','posto','shell','ipiranga','br petrobras','raizen',
            'ônibus','onibus','metro','metrô','trem','cptm','bilhete','brt','viação','rodoviaria',
            'estacionamento','zona azul','pedágio','pedagio','oficina','mecânica','mecanica','lavagem','borracharia',
            'ipva','licenciamento','multa','detran','dpvat'
        ], peso: 1.5
    },
    'Moradia': {
        palavrasChave: [
            'aluguel','condominio','condomínio','administradora',
            'agua','água','sabesp','cedae','saneamento',
            'luz','energia','enel','cpfl','cemig','eletropaulo',
            'gas','gás','comgas','ultragaz','liquigas',
            'internet','banda larga','fibra','vivo','claro','tim','oi','net','sky','telefone','celular',
            'reforma','pintura','encanador','eletricista','pedreiro','chaveiro','dedetização'
        ], peso: 2.0
    },
    'Saúde': {
        palavrasChave: [
            'farmacia','farmácia','drogaria','droga','raia','drogasil','pacheco','pague menos','ultrafarma',
            'hospital','clinica','clínica','laboratorio','laboratório','medico','médico','consulta','exame',
            'dentista','odonto','fisioterapia','psicologo','psicólogo','psiquiatra','terapia',
            'plano saude','plano de saúde','unimed','amil','bradesco saude','sulamerica'
        ], peso: 1.8
    },
    'Lazer': {
        palavrasChave: [
            'netflix','spotify','amazon prime','prime video','disney','disney+','hbo','hbo max',
            'apple tv','youtube premium','deezer','globoplay','paramount','star+',
            'cinema','cinemark','teatro','show','ingresso','evento','festa',
            'parque','zoologico','museu',
            'steam','playstation','xbox','nintendo','game','jogo','epic games',
            'hotel','pousada','airbnb','booking','decolar','viagem','passagem','azul','gol','latam','voo'
        ], peso: 1.3
    },
    'Educação': {
        palavrasChave: [
            'faculdade','universidade','escola','colégio','curso','aula','mensalidade','matrícula',
            'udemy','coursera','alura','rocketseat','dio',
            'livro','livraria','saraiva','apostila','material escolar','papelaria'
        ], peso: 1.6
    },
    'Outros': { palavrasChave: [], peso: 0.5 }
};

let historicoCategorizacao = JSON.parse(localStorage.getItem('historicoIA') || '{}');

function categorizarComIA(descricao) {
    if (!descricao || !descricao.trim()) return 'Outros';
    const texto = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const aprendida = buscarNoHistorico(texto);
    if (aprendida) return aprendida;

    const pts = {};
    for (const [cat, cfg] of Object.entries(baseConhecimentoIA)) {
        pts[cat] = 0;
        for (const p of cfg.palavrasChave) {
            const pn = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (texto.includes(pn)) {
                pts[cat] += cfg.peso + (texto.indexOf(pn) === 0 ? 0.5 : 0);
            }
        }
    }

    let melhor = 'Outros', max = 0;
    for (const [cat, pt] of Object.entries(pts)) { if (pt > max) { max = pt; melhor = cat; } }
    salvarNoHistorico(texto, melhor);
    return melhor;
}

function buscarNoHistorico(texto) {
    if (historicoCategorizacao[texto]) return historicoCategorizacao[texto];
    const inicio = texto.substring(0, 5);
    for (const [chave, cat] of Object.entries(historicoCategorizacao)) {
        if (chave.startsWith(inicio) && texto.includes(chave)) return cat;
    }
    return null;
}

function salvarNoHistorico(texto, cat) {
    historicoCategorizacao[texto] = cat;
    try { localStorage.setItem('historicoIA', JSON.stringify(historicoCategorizacao)); }
    catch(e) { historicoCategorizacao = {}; localStorage.removeItem('historicoIA'); }
}

function ensinarIA(descricao, categoria) {
    const t = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    salvarNoHistorico(t, categoria);
    mostrarNotificacao(`🎓 IA aprendeu: "${descricao}" = ${categoria}`, 'sucesso');
}

function resetarIA() {
    historicoCategorizacao = {};
    localStorage.removeItem('historicoIA');
    mostrarNotificacao('🧹 Histórico de IA limpo', 'info');
}

// ============================================
// DETECÇÃO DE DUPLICATAS — usa modal
// ============================================
function detectarDuplicata(novoGasto) {
    const usuario = buscarUsuarioAtual();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const duplicatas = usuario.gastos.filter(g => {
        const dataG = new Date(g.data);
        return g.nome.toLowerCase() === novoGasto.nome.toLowerCase()
            && Math.abs(g.valor - novoGasto.valor) < 0.10
            && dataG > seteDiasAtras;
    });

    if (duplicatas.length > 0) {
        const g = duplicatas[0];
        mostrarConfirm(
            '⚠️ Possível Duplicata',
            `Já existe um gasto similar nos últimos 7 dias:<br><br>
             <strong>${g.nome}</strong><br>
             Valor: ${formatarDinheiro(g.valor)}<br>
             Data: ${new Date(g.data).toLocaleDateString('pt-BR')}<br><br>
             Deseja adicionar mesmo assim?`,
            () => _adicionarGastoConfirmado(novoGasto)
        );
        return true;
    }
    return false;
}

// ============================================
// SUGESTÃO AUTOMÁTICA DE CATEGORIA
// ============================================
function sugerirCategoria(descricao) {
    if (descricao.length < 3) return;
    const cat = categorizarComIA(descricao);
    const sel = document.getElementById('campoCategoria');
    if (sel && cat !== 'Outros') {
        sel.value = cat;
        sel.style.borderColor = '#10b981';
        setTimeout(() => { sel.style.borderColor = ''; }, 1500);
    }
}

function exportarAprendizadoIA() {
    const blob = new Blob([JSON.stringify(historicoCategorizacao, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ia-aprendizado.json'; a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacao('📥 Aprendizado exportado!', 'sucesso');
}
