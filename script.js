// =================================================================
// CONFIGURAÇÕES
// =================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    carregarDados();
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
// 2. FUNÇÃO DE PESQUISA (NOME E/OU DATA) - ATUALIZADO
// =================================================================
document.getElementById("btnPesquisar").addEventListener("click", function() {
    const nomeInput = document.getElementById("nomePesquisa").value.trim().toLowerCase();
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.getElementById("resPesquisa");
    
    // Validação: Precisa preencher pelo menos um dos campos
    if (!nomeInput && !dataInput) {
        alert("Por favor, digite um nome OU selecione uma data.");
        return;
    }

    let dia = "", mes = "";
    if (dataInput) {
        const partes = dataInput.split("-");
        mes = partes[1];
        dia = partes[2];
    }
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;

        let bateuNome = true;
        let bateuData = true;

        // 1. Se digitou nome, verifica se contém o texto (ignorando maiúsculas/minúsculas)
        if (nomeInput) {
            bateuNome = p.nome.toLowerCase().includes(nomeInput);
        }

        // 2. Se selecionou data, verifica dia e mês
        if (dataInput) {
            const dataString = p.dataNascimento.substring(0, 10);
            bateuData = dataString.endsWith(`-${mes}-${dia}`);
        }

        // Retorna verdadeiro apenas se passar nos dois testes (se o campo estiver vazio, o teste é true automaticamente)
        return bateuNome && bateuData;
    });

    renderizarLista(encontrados, divResultado, "Nenhum resultado encontrado para sua busca.");
});

// =================================================================
// 3. FUNÇÃO DE RELATÓRIO (VER NA TELA)
// =================================================================
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    // Início: Daqui a 7 dias
    const dataInicio = new Date(hoje);
    dataInicio.setDate(hoje.getDate() + 7);
    
    // Fim: Daqui a 14 dias
    const dataFim = new Date(hoje);
    dataFim.setDate(hoje.getDate() + 14);
    dataFim.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        
        const dataNasc = new Date(p.dataNascimento);
        const aniverEsteAno = new Date(dataInicio.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());

        if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && dataNasc.getUTCMonth() === 0) {
            aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
        }

        return aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim;
    });

    const diaIni = String(dataInicio.getDate()).padStart(2,'0');
    const mesIni = String(dataInicio.getMonth()+1).padStart(2,'0');
    const diaFim = String(dataFim.getDate()).padStart(2,'0');
    const mesFim = String(dataFim.getMonth()+1).padStart(2,'0');

    renderizarLista(aniversariantes, divResultado, `Ninguém faz aniversário na próxima semana (${diaIni}/${mesIni} a ${diaFim}/${mesFim}).`);
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
// FUNÇÕES AUXILIARES
// =================================================================
function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; 

    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p class="placeholder-text">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");

    lista.forEach(p => {
        const li = document.createElement("li");
        
        const dataObj = new Date(p.dataNascimento);
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        
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
