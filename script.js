// =================================================================
// CONFIGURAÇÕES
// =================================================================
// IMPORTANTE: Se você criou uma "Nova Versão" no Apps Script, 
// verifique se a URL mudou e atualize aqui:
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    carregarDados();
    
    // Define a aba de Cadastro como inicial
    // (Simula um clique na aba para ativar a classe visual correta)
    document.querySelector(".tab-link").click();
};

function carregarDados() {
    console.log("🔄 Baixando dados da planilha...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            pessoas = data;
            console.log("✅ Dados carregados:", pessoas.length, "pessoas.");
        })
        .catch(err => console.error("❌ Erro ao carregar dados", err));
}

// =================================================================
// 1. FUNÇÃO DE CADASTRO (SALVAR)
// =================================================================
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector("button");
    const textoOriginal = btn.innerText;

    // Feedback visual para o usuário
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    // TRUQUE DO TEXT/PLAIN: Evita erro de CORS (Bloqueio do navegador)
    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(pessoa)
    })
    .then(res => res.json())
    .then(() => {
        alert("✅ Cadastro salvo com sucesso!");
        form.reset();
        carregarDados(); // Atualiza a lista na memória
    })
    .catch(err => {
        alert("Erro ao salvar: " + err);
        console.error(err);
    })
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// =================================================================
// 2. FUNÇÃO DE PESQUISA (POR DATA)
// =================================================================
document.getElementById("btnPesquisar").addEventListener("click", function() {
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.getElementById("resPesquisa");
    
    if (!dataInput) {
        alert("Por favor, selecione um dia e mês no calendário.");
        return;
    }

    // Pega o Mês e Dia do input (formato YYYY-MM-DD)
    const [ano, mes, dia] = dataInput.split("-");
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        // Pega apenas os 10 primeiros caracteres da data ISO vinda do Google (YYYY-MM-DD)
        const dataString = p.dataNascimento.substring(0, 10);
        // Verifica se termina com o mesmo Mês e Dia (ignora ano)
        return dataString.endsWith(`-${mes}-${dia}`);
    });

    renderizarLista(encontrados, divResultado, "Nenhum aniversariante encontrado nesta data.");
});

// =================================================================
// 3. FUNÇÃO DE RELATÓRIO (VER NA TELA)
// =================================================================
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    // Define o limite (hoje + 7 dias)
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() + 7);
    dataLimite.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        
        const dataNasc = new Date(p.dataNascimento);
        
        // Cria uma data de aniversário para o ANO ATUAL para comparação correta
        // getUTCMonth é usado pois a data do Google vem em UTC
        const aniverEsteAno = new Date(hoje.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());

        // Se o niver já passou este ano (ex: foi ontem), não mostra.
        // Se quiséssemos mostrar nivers que passaram, ajustaríamos a lógica.
        // Aqui focamos em "Próximos 7 dias":
        return aniverEsteAno >= hoje && aniverEsteAno <= dataLimite;
    });

    renderizarLista(aniversariantes, divResultado, "Ninguém faz aniversário nos próximos 7 dias.");
});

// =================================================================
// 4. FUNÇÃO DE EMAIL MANUAL (ACIONAR O SERVIDOR)
// =================================================================
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    const textoOriginal = btn.innerText;
    
    // Confirmação de segurança
    if(!confirm("Deseja enviar agora o email com os aniversariantes da PRÓXIMA semana (Daqui a 7 dias)?")) {
        return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    // Envia comando "action: enviar_email"
    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action: "enviar_email" }) 
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "enviado") {
            alert(`✅ Email enviado com sucesso!\nForam encontrados ${data.qtd} aniversariantes.`);
        } else if (data.status === "vazio") {
            alert("ℹ️ Processo concluído, mas nenhum aniversariante foi encontrado no intervalo da próxima semana.");
        } else {
            alert("⚠️ Resposta inesperada do servidor: " + JSON.stringify(data));
        }
    })
    .catch(err => {
        alert("❌ Erro ao tentar enviar email: " + err);
        console.error(err);
    })
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// =================================================================
// FUNÇÕES AUXILIARES (UI e RENDERIZAÇÃO)
// =================================================================

// Função para gerar o HTML da lista de pessoas
function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; // Limpa resultados anteriores

    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p class="placeholder-text">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");

    lista.forEach(p => {
        const li = document.createElement("li");
        
        // Formatar data para dia/mês visualmente
        const dataObj = new Date(p.dataNascimento);
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const dataFormatada = `${dia}/${mes}`;
        
        li.innerHTML = `
            <div>
                <strong>${p.nome}</strong>
                <div style="font-size: 0.85rem; color: #666;">📞 ${p.telefone || "Sem telefone"}</div>
            </div>
            <div style="font-weight: bold; color: #2563eb;">🎂 ${dataFormatada}</div>
        `;
        ul.appendChild(li);
    });

    elementoAlvo.appendChild(ul);
}

// Função para trocar as abas
function abrirTab(evt, tabNome) {
    // 1. Esconde todo o conteúdo
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].style.display = "none";
        conteudos[i].classList.remove("active");
    }

    // 2. Remove a classe 'active' dos botões
    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }

    // 3. Mostra o conteúdo atual
    document.getElementById(tabNome).style.display = "block";
    document.getElementById(tabNome).classList.add("active");
    
    // 4. Ativa o botão clicado
    if (evt && evt.currentTarget) {
        evt.currentTarget.className += " active";
    }
}

