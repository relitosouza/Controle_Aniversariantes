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

## 🚀 Como Configurar (Passo a Passo)
Para rodar este projeto, você precisará configurar o backend no Google.

1. Preparar a Planilha
Crie uma nova Planilha do Google.

Na primeira linha, crie exatamente os seguintes cabeçalhos (ordem importa):

Coluna A: Nome

Coluna B: Endereço

Coluna C: CEP

Coluna D: Telefone

Coluna E: Data de Nascimento

Coluna F: ID (Importante para a função de excluir)

Renomeie a aba inferior para Página1 (ou ajuste a variável SHEET_NAME no código).

2. Configurar o Google Apps Script
Na planilha, clique em Extensões > Apps Script.

Apague o código padrão e cole o código do backend (code.gs) fornecido no projeto.

Edite a variável EMAIL_DESTINO com o seu e-mail.

Clique em Salvar.

3. Criar a API (Deploy)
No Apps Script, clique em Implantar > Nova implantação.

Clique na engrenagem e selecione App da Web.

Preencha:

Descrição: Versão 1.0

Executar como: Eu (seu email)

Quem pode acessar: Qualquer pessoa (Essencial para o site funcionar).

Clique em Implantar e copie a URL gerada (termina em /exec).

4. Conectar o Frontend
Abra o arquivo script.js deste repositório.

Na primeira linha, substitua a variável API_URL pela URL que você copiou no passo anterior:

JavaScript

const API_URL = "[https://script.google.com/macros/s/SEU_CODIGO_AQUI/exec](https://script.google.com/macros/s/SEU_CODIGO_AQUI/exec)";
5. Configurar Automação de E-mail (Opcional)
No Apps Script, vá no menu lateral esquerdo em Acionadores (ícone de relógio).

Clique em Adicionar acionador.

Configure:

Função: processarEnvioEmail

Origem do evento: Baseado no tempo

Tipo: Contador semanal

Dia: Segunda-feira (ou conforme preferir).

##🖼️ Screenshots
(Recomendo você tirar prints do seu sistema funcionando e colar aqui depois)

##📄 Licença
Este projeto está sob a licença MIT. Sinta-se à vontade para usar e modificar.
