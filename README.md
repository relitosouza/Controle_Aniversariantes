# 🎂 Controle de Aniversários

Sistema web para gestão de aniversariantes integrado ao Google Sheets.

> **Status:** ✅ Finalizado | **Versão:** 1.0

Este projeto é uma solução serverless que utiliza o **Google Sheets** como banco de dados e o **Google Apps Script** como API backend, permitindo o cadastro, consulta, exclusão e notificação automática de aniversariantes.

---

## ✨ Funcionalidades

* **Cadastro:** Salva nome, endereço, CEP, telefone e data.
* **Gestão (CRUD):** Permite excluir registros incorretos ou antigos.
* **Busca Híbrida:** Pesquise pelo nome, pela data ou pelos dois simultaneamente.
* **Smart UX:** Máscara de telefone automática `(11) 99999-9999`.
* **Relatório Semanal:** Mostra na tela os aniversariantes dos próximos 7 dias.
* **📧 Notificações:**
    * Envio automático de e-mail toda segunda-feira (via Trigger).
    * Envio manual sob demanda via botão no painel.

---

## 📂 Estrutura dos Arquivos

Aqui está a organização dos arquivos principais do projeto:

* **`index.html`**
    * Contém a estrutura da página, formulários e navegação por abas.
* **`style.css`**
    * Define o design moderno, cores, cards e responsividade (mobile-first).
* **`script.js`**
    * Contém toda a lógica do cliente:
        * Conexão com a API do Google (Fetch).
        * Lógica de filtros e datas.
        * Máscaras de input e alertas.

---

## 🚀 Guia de Instalação e Configuração

Siga estes 4 passos para colocar o sistema no ar.

### 1. Configurar a Planilha (Banco de Dados)
1. Crie uma nova **Planilha do Google**.
2. Renomeie a aba (lá embaixo) para: `Página1`.
3. Na primeira linha (**A1 até F1**), crie exatamente estes cabeçalhos:

| A | B | C | D | E | F |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nome** | **Endereço** | **CEP** | **Telefone** | **Data de Nascimento** | **ID** |

### 2. Configurar o Backend (Apps Script)
1. Na planilha, clique no menu **Extensões** > **Apps Script**.
2. Apague qualquer código que estiver lá e cole o código do arquivo `.gs` deste projeto.
3. No topo do código, altere o e-mail de destino:
   ```javascript
   const EMAIL_DESTINO = "seu.email@exemplo.com";
