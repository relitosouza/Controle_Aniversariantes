# 🎂 Controle de Aniversários

Um sistema web leve e eficiente para gerenciamento de aniversariantes, utilizando o **Google Sheets** como banco de dados e o **Google Apps Script** como backend serverless.

O projeto permite cadastrar pessoas, pesquisar datas, visualizar os aniversariantes da próxima semana e enviar alertas automáticos por e-mail.

![Status do Projeto](https://img.shields.io/badge/Status-Finalizado-green)

## ✨ Funcionalidades

- **📋 Cadastro Completo:** Salva Nome, Endereço, CEP, Telefone (com máscara automática) e Data de Nascimento.
- **☁️ Banco de Dados em Nuvem:** Todos os dados são salvos instantaneamente em uma Planilha do Google.
- **🔍 Pesquisa Inteligente:** Filtre aniversariantes pelo **Nome** ou pela **Data** (Dia/Mês).
- **🗑️ Gestão de Dados:** Possibilidade de **excluir** cadastros diretamente pela interface (CRUD).
- **📊 Relatório Semanal:** Exibe na tela quem faz aniversário nos próximos 7 dias.
- **📧 Notificações por E-mail:**
  - **Automática:** Envia um e-mail toda segunda-feira com a lista dos aniversariantes da semana seguinte.
  - **Manual:** Botão para forçar o envio do e-mail de alerta a qualquer momento.
- **📱 Interface Responsiva:** Layout moderno com navegação por abas e adaptável a celulares.

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 (Design responsivo e clean)
  - JavaScript (Fetch API para comunicação assíncrona)
- **Backend / Database:**
  - Google Apps Script (API REST)
  - Google Sheets (Armazenamento dos dados)

## 📂 Estrutura do Projeto

```bash
/
├── index.html      # Estrutura e abas da aplicação
├── style.css       # Estilização visual
├── script.js       # Lógica do frontend e conexão com API
└── README.md       # Documentação

