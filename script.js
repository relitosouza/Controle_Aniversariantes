const API_URL = "https://script.google.com/macros/s/AKfycbyKO-lVijHWeTDiL3tgiVj2E8DZvhrqIT47x8RgCEY7lrskPMz75YPsUiq5uhkHDtcv/exec";

let pessoas = [];

// CARREGAR DADOS
window.onload = carregarDados;

function carregarDados() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => pessoas = data)
        .catch(err => console.error("Erro ao carregar dados", err));
}

// CADASTRO
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pessoa)
    })
    .then(res => res.json())
    .then(() => {
        alert("Cadastro salvo na planilha!");
        form.reset();
        carregarDados();
    })
    .catch(err => alert("Erro ao salvar"));
});
