# 🖨️ Print3D

Sistema web para gerenciamento de impressões 3D, permitindo o controle de clientes, pedidos, aprovação de orçamentos e acompanhamento de produção através de uma interface moderna e intuitiva.

## ✨ Funcionalidades

- 🔐 Autenticação de usuários
- 👥 Gerenciamento de clientes
- 📦 Gerenciamento de pedidos
- 📊 Dashboard com métricas e gráficos
- 📋 Kanban para acompanhamento dos pedidos
- ✅ Aprovação de pedidos
- ❌ Rejeição de pedidos
- 📁 Upload de arquivos dos pedidos
- 📱 Interface responsiva
- 🔄 Integração com API Laravel

---

## 🛠️ Tecnologias Utilizadas

### Frontend

- React
- TypeScript
- Vite
- React Router DOM
- Axios
- Recharts

### UI e Estilização

- Tailwind CSS
- Lucide React

---

## 📂 Estrutura do Projeto

```text
src/
├── components/
├── contexts/
├── pages/
├── services/
├── types/
├── lib/
└── main.tsx
```

---

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/BarceloDev/print3d.git
```

Entre na pasta:

```bash
cd print3d
```

Instale as dependências:

```bash
pnpm install
```

Execute o projeto:

```bash
pnpm dev
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

---

## 🏗️ Build de Produção

```bash
pnpm build
```

Preview local:

```bash
pnpm preview
```

---

## 🔗 Backend

Esta aplicação consome a API disponível em:

https://github.com/BarceloDev/print3d-web-api

---

## 👨‍💻 Autor

**Guilherme Barcelo**

- LinkedIn: https://www.linkedin.com/in/guilherme-barcelo
- Instagram: https://www.instagram.com/guibarcelo_

---

Projeto desenvolvido para otimizar o gerenciamento de serviços de impressão 3D.
