// =================================================================
// CONFIGURAÇÕES
// =================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyyZO4mSvDnYLXiD3EmkSuIBUIDrOBVDo0207cI4pQLzmSD4Cqliv8w65fsoIoHeEuZ/exec";

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    carregarDados();
    // Simula clique na aba inicial para carregar visual correto
    const abaInicial = document.querySelector(".tab-link");
    if(abaInicial) abaInicial.click();
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

    btn.innerText = "Salvando...";
    btn.disabled = true;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(pessoa)
    })
    .then(res => res.json())
    .then(() => {
        alert("✅ Cadastro salvo com sucesso!");
        form.reset();
        carregarDados();
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

    const [ano, mes, dia] = dataInput.split("-");
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        const dataString = p.dataNascimento.substring(0, 10);
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
    
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() + 7);
    dataLimite.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        const dataNasc = new Date(p.dataNascimento);
        const aniverEsteAno = new Date(hoje.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());
        return aniverEsteAno >= hoje && aniverEsteAno <= dataLimite;
    });

    renderizarLista(aniversariantes, divResultado, "Ninguém faz aniversário nos próximos 7 dias.");
});

// =================================================================
// 4. FUNÇÃO DE EMAIL MANUAL
// =================================================================
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    const textoOriginal = btn.innerText;
    
    if(!confirm("Deseja enviar agora o email com os aniversariantes da PRÓXIMA semana?")) {
        return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "enviar_email" }) 
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "enviado") {
            alert(`✅ Email enviado com sucesso!\nForam encontrados ${data.qtd} aniversariantes.`);
        } else if (data.status === "vazio") {
            alert("ℹ️ Nenhum aniversariante encontrado para a próxima semana.");
        } else {
            alert("⚠️ Resposta inesperada: " + JSON.stringify(data));
        }
    })
    .catch(err => alert("❌ Erro: " + err))
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// =================================================================
// 5. MÁSCARA DE TELEFONE
// =================================================================
const inputTelefone = document.querySelector('input[name="telefone"]');

if (inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        let value = e.target.value;
        value = value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
        e.target.value = value;
    });
}

// =================================================================
// FUNÇÕES AUXILIARES (UI)
// =================================================================

// --- AQUI ESTÁ A MUDANÇA PARA EXIBIR TODOS OS DADOS ---
function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; 

    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p class="placeholder-text">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");

    lista.forEach(p => {
        const li = document.createElement("li");
        
        // Formatar Data
        const dataObj = new Date(p.dataNascimento);
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        
        // Prepara o texto do CEP (se existir)
        const cepTexto = p.cep ? ` - CEP: ${p.cep}` : "";
        const enderecoTexto = p.endereco ? p.endereco : "Endereço não informado";

        li.innerHTML = `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong style="font-size: 1.1rem; color: #1e3a8a;">${p.nome}</strong>
                    <span style="background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 0.9rem;">
                        🎂 ${dia}/${mes}
                    </span>
                </div>
                
                <div style="margin-bottom: 3px; color: #444;">
                    📞 ${p.telefone || "Sem telefone"}
                </div>
                
                <div style="font-size: 0.9rem; color: #666; display: flex; align-items: flex-start;">
                    <span style="margin-right: 5px;">🏠</span> 
                    <span>${enderecoTexto}${cepTexto}</span>
                </div>
            </div>
        `;
        ul.appendChild(li);
    });

    elementoAlvo.appendChild(ul);
}

function abrirTab(evt, tabNome) {
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].style.display = "none";
        conteudos[i].classList.remove("active");
    }

    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }

    document.getElementById(tabNome).style.display = "block";
    document.getElementById(tabNome).classList.add("active");
    
    if (evt && evt.currentTarget) {
        evt.currentTarget.className += " active";
    }
}
