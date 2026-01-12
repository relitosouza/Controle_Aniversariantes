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
    const abaInicial = document.querySelector(".tab-link");
    if(abaInicial) abaInicial.click();
};

function carregarDados() {
    console.log("🔄 Baixando dados...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            pessoas = data;
            console.log("✅ Dados carregados:", pessoas.length);
            // Atualiza a tela se estiver na aba de relatório ou pesquisa
            if(document.getElementById("resRelatorio").innerHTML !== "") {
               document.getElementById("btnRelatorio").click();
            }
        })
        .catch(err => console.error("❌ Erro", err));
}

// =================================================================
// 1. SALVAR (CREATE)
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
        alert("✅ Cadastro salvo!");
        form.reset();
        carregarDados();
    })
    .catch(err => alert("Erro: " + err))
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// =================================================================
// 2. EXCLUIR (DELETE) - NOVA FUNÇÃO
// =================================================================
function excluirPessoa(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    // Feedback visual (opcional: mudar cursor)
    document.body.style.cursor = "wait";

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "excluir", id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "excluido") {
            alert("🗑️ Cadastro excluído com sucesso!");
            carregarDados(); // Recarrega a lista
            
            // Limpa as telas de resultado para não mostrar dados velhos
            document.getElementById("resPesquisa").innerHTML = "";
            document.getElementById("resRelatorio").innerHTML = "";
        } else {
            alert("Erro ao excluir: " + JSON.stringify(data));
        }
    })
    .catch(err => alert("Erro de conexão: " + err))
    .finally(() => {
        document.body.style.cursor = "default";
    });
}

// =================================================================
// 3. PESQUISA
// =================================================================
document.getElementById("btnPesquisar").addEventListener("click", function() {
    const nomeInput = document.getElementById("nomePesquisa").value.trim().toLowerCase();
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.getElementById("resPesquisa");
    
    if (!nomeInput && !dataInput) {
        alert("Digite um nome ou data.");
        return;
    }

    let dia = "", mes = "";
    if (dataInput) {
        const partes = dataInput.split("-");
        mes = partes[1]; dia = partes[2];
    }
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        let bateuNome = true;
        let bateuData = true;

        if (nomeInput) bateuNome = p.nome.toLowerCase().includes(nomeInput);
        if (dataInput) {
            const dataString = p.dataNascimento.substring(0, 10);
            bateuData = dataString.endsWith(`-${mes}-${dia}`);
        }
        return bateuNome && bateuData;
    });

    renderizarLista(encontrados, divResultado, "Nenhum resultado.");
});

// =================================================================
// 4. RELATÓRIO
// =================================================================
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    
    const dataInicio = new Date(hoje); dataInicio.setDate(hoje.getDate() + 7);
    const dataFim = new Date(hoje); dataFim.setDate(hoje.getDate() + 14); dataFim.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        const dataNasc = new Date(p.dataNascimento);
        const aniverEsteAno = new Date(dataInicio.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());
        if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && dataNasc.getUTCMonth() === 0) {
            aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
        }
        return aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim;
    });

    renderizarLista(aniversariantes, divResultado, "Ninguém na próxima semana.");
});

// =================================================================
// 5. EMAIL MANUAL
// =================================================================
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    if(!confirm("Enviar email da PRÓXIMA semana?")) return;
    
    btn.innerText = "Enviando..."; btn.disabled = true;

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "enviar_email" }) 
    })
    .then(res => res.json())
    .then(data => alert(data.status === "enviado" ? `✅ Enviado! (${data.qtd})` : "ℹ️ Ninguém encontrado."))
    .catch(err => alert("Erro: " + err))
    .finally(() => { btn.innerText = "📧 Enviar Aviso por Email Agora"; btn.disabled = false; });
});

// =================================================================
// 6. UI & UTILS
// =================================================================
const inputTelefone = document.querySelector('input[name="telefone"]');
if (inputTelefone) {
    inputTelefone.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
        e.target.value = v;
    });
}

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
        
        // --- AQUI ESTÁ A MUDANÇA: BOTÃO DE EXCLUIR ---
        // Adicionamos um botão que chama a função excluirPessoa com o ID
        const btnDelete = `<button class="btn-delete" onclick="excluirPessoa('${p.id}', '${p.nome}')">🗑️ Excluir</button>`;

        li.innerHTML = `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div>
                        <strong style="font-size: 1.1rem; color: #1e3a8a;">${p.nome}</strong>
                        ${btnDelete} 
                    </div>
                    <span style="background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 0.9rem;">
                        🎂 ${dia}/${mes}
                    </span>
                </div>
                <div style="margin-bottom: 3px; color: #444;">📞 ${p.telefone || "Sem telefone"}</div>
                <div style="font-size: 0.9rem; color: #666;">🏠 ${p.endereco || "Endereço não informado"}${cepTexto}</div>
            </div>
        `;
        ul.appendChild(li);
    });
    elementoAlvo.appendChild(ul);
}

function abrirTab(evt, tabNome) {
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].style.display = "none"; conteudos[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }
    document.getElementById(tabNome).style.display = "block";
    document.getElementById(tabNome).classList.add("active");
    if (evt && evt.currentTarget) evt.currentTarget.className += " active";
}
