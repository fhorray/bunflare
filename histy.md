# Bunflare Implementation History

Este documento registra todas as implementações e marcos alcançados durante o desenvolvimento do framework **Bunflare**.

## 1. Core Runtime & Shims

### 1.1 `Bun.serve` Bridge
- **O que é**: Transformação da API imperativa `Bun.serve` do Bun para o modelo declarativo `export default { fetch }` do Cloudflare Workers.
- **Destaque**: Criação de um objeto `server` simulado que fornece acesso ao IP do cliente, hostname e bindings do Cloudflare (`env`, `ctx`).

### 1.2 Fullstack Routing
- **O que é**: Suporte à propriedade `routes` no `Bun.serve`.
- **Implementação**: Uso da API nativa `URLPattern` do Cloudflare para roteamento de alta performance.
- **Suporte**: Aceita caminhos fixos, padrões com parâmetros (`:id`) e wildcards (`*`).

### 1.3 Bun API Parity
- **SQLite**: Shim de `bun:sqlite` mapeando para o Cloudflare D1 (Assíncrono por baixo, mas mantendo interface compatível).
- **Environment**: Proxy para `Bun.env` que resolve variáveis tanto do Worker `env` quanto do `process.env`.
- **Crypto**: Implementação de `Bun.password` (hash/verify) e `Bun.hash` usando a Web Crypto API.

---

## 2. Fullstack & Assets Pipeline

### 2.1 Workers Assets Integration (Option A)
- **O que é**: Proxy automático de assets estáticos.
- **Mecânica**: O shim detecta o binding `ASSETS`. Se nenhuma rota de API coincidir, ele tenta servir o arquivo da pasta de assets automaticamente.

### 2.2 Dual-Pass Build
- **Script**: `app/build.ts`
- **Fluxo**:
  1. Limpa o diretório `dist/`.
  2. Build do Worker (Backend) com o plugin Bunflare.
  3. Build do HTML/React (Frontend) usando o bundler nativo do Bun (transpilação de TSX, CSS e hashing de arquivos).

### 2.3 React Integration
- Estrutura completa de aplicação React dentro do `app/`.
- Suporte a importação de assets (`.svg`, `.png`) diretamente no código TSX com hashing automático.

---

## 3. Developer Experience (DX)

### 3.1 Live Reload Inteligente (HMR-like)
- **O que é**: Atualização automática do navegador ao salvar arquivos.
- **Implementação**:
  - O shim gera um `buildId` único por instância do Worker.
  - Injeção automática de um script cliente em respostas HTML.
  - O script monitora o endpoint `/_bunflare/hmr`. Se o ID mudar (sinal de novo build), a página recarrega instantaneamente.

### 3.2 Type Safety
- Refatoração completa para remover tipos `any`.
- Definição de `runtime.d.ts` para os módulos virtuais `bunflare:*`.
- Augmentations em `env.d.ts` para os bindings do Cloudflare.

---

## 4. Infraestrutura & Testes

### 4.1 Wrangler Integration
- Configuração de `watch_dir` no `wrangler.jsonc` para monitorar `src/` e `public/`.
- Automação do ciclo: `Mudança -> Build -> Worker Restart -> Browser Reload`.

### 4.2 Testes Automatizados
- Suíte de testes usando `bun:test`.
- Testes de integração verificando a transformação de código (Env, SQLite, Preamble).
- Testes de unidade para a lógica de roteamento do shim.

---

**Status Atual**: v0.5.0-alpha (Fullstack Ready)
**Próximo Marco**: Publicação no NPM e exemplos de R2/KV.
