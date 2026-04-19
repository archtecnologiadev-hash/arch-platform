# ARCH Platform

Plataforma premium de gestão de projetos de arquitetura e interiores. Conecta arquitetos, clientes e fornecedores em um ambiente dark e sofisticado.

## Visão Geral

A ARCH Platform possui três perfis de usuário com fluxos dedicados:

| Perfil | Acesso | Descrição |
|--------|--------|-----------|
| **Arquiteto** | `/arquiteto/*` | Dashboard de projetos, pipeline visual, calendário de obra, diretório de fornecedores |
| **Cliente** | `/cliente/*` | Portal de acompanhamento do projeto, calendário, chat com o arquiteto |
| **Fornecedor** | `/fornecedor/*` | Dashboard de orçamentos, mensagens, perfil público ("link na bio") |

## Rotas Principais

### Públicas
- `/` — Landing page
- `/fornecedor/[slug]` — Perfil público do fornecedor (galeria, vídeo, modal de orçamento)
- `/escritorio/[slug]` — Página pública do escritório de arquitetura
- `/login` e `/cadastro` — Autenticação

### Arquiteto (`/arquiteto/*`)
- `/arquiteto/dashboard` — Pipeline de projetos em cards visuais com grid responsivo
- `/arquiteto/projetos/[id]` — Detalhes do projeto: arquivos, notas, fornecedores, calendário, orçamento
- `/arquiteto/fornecedores` — Diretório filtrado por segmento com solicitação de orçamento
- `/arquiteto/clientes` — Lista de clientes

### Cliente (`/cliente/*`)
- `/cliente/projeto/[id]` — Portal do cliente: andamento, calendário da obra, arquivos, chat

### Fornecedor (`/fornecedor/*`)
- `/fornecedor/dashboard` — Resumo de orçamentos, mensagens e avaliação
- `/fornecedor/orcamentos` — Lista completa com filtros por status e modal de resposta
- `/fornecedor/mensagens` — Chat em tempo real com arquitetos
- `/fornecedor/perfil` — Editor de perfil com preview ao vivo
- `/fornecedor/catalogo` — Catálogo de produtos/serviços

## Stack Técnica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Inline styles (design system próprio dark `#080808` / dourado `#c8a96e`)
- **Componentes:** Radix UI + shadcn/ui
- **Ícones:** Lucide React
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 18.17+
- npm 9+

## Rodando Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/arch-platform.git
cd arch-platform

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local conforme necessário

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento (porta 3000)
npm run build    # Build de produção
npm run start    # Servidor de produção (após build)
npm run lint     # Verificação de lint
```

## Deploy na Vercel

### Via CLI

```bash
# Instale a Vercel CLI
npm install -g vercel

# Login
vercel login

# Preview (staging)
vercel

# Produção
vercel --prod
```

### Via GitHub (deploy automático)

1. Push do código para o GitHub
2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
3. Adicione as variáveis de ambiente em **Project Settings → Environment Variables**
4. Clique em **Deploy**

Após isso, todo push para `main` dispara um deploy automático.

## Estrutura do Projeto

```
arch-platform/
├── app/
│   ├── (arquiteto)/           # Layout sidebar + páginas do arquiteto
│   ├── (cliente)/             # Layout sidebar + páginas do cliente
│   ├── (cliente-view)/        # Portal do cliente sem sidebar
│   ├── (fornecedor)/          # Dashboard do fornecedor com sidebar
│   ├── (fornecedor-pub)/      # Perfil público sem sidebar
│   ├── (auth)/                # Login e cadastro
│   ├── (public)/              # Landing, sobre, contato
│   └── escritorio/[slug]/     # Página pública do escritório
├── components/
│   ├── shared/
│   │   └── CalendarioObra.tsx # Calendário reutilizável (prop readonly)
│   ├── layout/
│   └── ui/                    # Componentes shadcn/ui
├── lib/
├── types/
├── .env.example               # Variáveis de ambiente necessárias
└── next.config.mjs            # Configuração Next.js + remotePatterns Unsplash
```

## Variáveis de Ambiente

Copie `.env.example` para `.env.local`. No estado atual (dados mock), nenhuma variável é obrigatória para rodar localmente. Para produção com banco de dados e autenticação, preencha as variáveis correspondentes.

## Notas

- **Dados mock:** toda a plataforma usa dados simulados — nenhum banco de dados conectado.
- **Autenticação:** não implementada — as rotas são acessíveis diretamente.
- **CalendarioObra:** componente compartilhado com prop `readonly` — editável no painel do arquiteto e somente-leitura no portal do cliente e do fornecedor.
