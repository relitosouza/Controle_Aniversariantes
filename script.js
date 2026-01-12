// --- CONFIGURAÇÃO ---
// ATENÇÃO: Se você criou uma nova implantação, atualize a URL abaixo!
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";

let pessoas = [];

// --- INICIALIZAÇÃO ---
window.onload = function() {
    carregarDados();
    // Define a aba inicial padrão (caso o HTML não defina)
    document.getElementById("tab-cadastro").style.display = "block";
};

// --- FUNÇÃO DE CARREGAMENTO DE DADOS (GET) ---
function carregarDados() {
    console.log("Baixando dados da planilha...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            pessoas = data;
            console.log("Dados carregados:", pessoas.length, "pessoas.");
        })
        .catch(err => console.error("Erro ao carregar dados", err));
}

// --- 1. FUNÇÃO DE CADASTRO (POST) ---
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector("button");
    const textoOriginal = btn.innerText;

    // Feedback visual
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    // CORREÇÃO DE CORS: headers como text/plain
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
        carregarDados(); // Atualiza a lista local
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

// --- 2. FUNÇÃO DE PESQUISA POR DATA ---
document.getElementById("btnPesquisar").addEventListener("click", function() {
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.getElementById("resPesquisa");
    
    if (!dataInput) {
        alert("Por favor, selecione uma data no calendário.");
        return;
    }

    // Pega o Mês e Dia do input (formato YYYY-MM-DD)
    const [ano, mes, dia] = dataInput.split("-");
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        // Pega apenas os 10 primeiros caracteres da data ISO vinda do Google (YYYY-MM-DD)
        const dataString = p.dataNascimento.substring(0, 10);
        return dataString.endsWith(`-${mes}-${dia}`);
    });

    renderizarLista(encontrados, divResultado, "Nenhum aniversariante encontrado nesta data.");
});

// --- 3. FUNÇÃO DE RELATÓRIO SEMANAL ---
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    
    const hoje = new Date();
    
    // Define o limite (hoje + 7 dias)
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 7);

    // Zera as horas para comparar apenas as datas
    hoje.setHours(0,0,0,0);
    dataLimite.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        
        const dataNasc = new Date(p.dataNascimento);
        
        // Cria uma data de aniversário para o ANO ATUAL
        // dataNasc.getUTCMonth() é usado pois a data vem como UTC do Google
        const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());

        return aniversarioEsteAno >= hoje && aniversarioEsteAno <= dataLimite;
    });

    renderizarLista(aniversariantes, divResultado, "Ninguém faz aniversário nos próximos 7 dias.");
});

// --- FUNÇÃO AUXILIAR: RENDERIZAR HTML ---
function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; // Limpa resultados anteriores

    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p class="placeholder-text">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");

    lista.forEach(p => {
        const li = document.createElement("li");
        
        // Formatar data para dia/mês (usando UTC para evitar erro de fuso horário)
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

// --- LÓGICA DAS ABAS (TABS) ---
function abrirTab(evt, tabNome) {
    // 1. Esconde todo o conteúdo das abas
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].style.display = "none";
        conteudos[i].classList.remove("active");
    }

    // 2. Remove a classe 'active' de todos os botões
    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }

    // 3. Mostra o conteúdo atual e ativa o botão
    document.getElementById(tabNome).style.display = "block";
    document.getElementById(tabNome).classList.add("active");
    
    // Adiciona classe active no botão clicado (se o evento existir)
    if (evt) {
        evt.currentTarget.className += " active";
    }
}
// --- 4. FUNÇÃO DE ENVIO MANUAL DE EMAIL ---
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    const textoOriginal = btn.innerText;
    
    if(!confirm("Deseja enviar o email com os aniversariantes da PRÓXIMA semana para o administrador?")) {
        return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    // Envia um comando especial para o Google Script
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
            alert(`✅ Email enviado com sucesso! (${data.qtd} aniversariantes encontrados)`);
        } else {
            alert("ℹ️ Nenhum aniversariante encontrado para a próxima semana (intervalo de aviso). O email não foi enviado.");
        }
    })
    .catch(err => {
        alert("Erro ao enviar email: " + err);
    })
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});
