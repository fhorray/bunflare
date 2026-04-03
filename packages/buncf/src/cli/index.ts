#!/usr/bin/env bun
import { runBuild } from "./build";
import { runInit } from "./init";

/**
 * CLI Entry point for buncf.
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "init": {
      await runInit();
      break;
    }

    case "build": {
      const production = process.argv.includes("--production") || process.argv.includes("-p");
      await runBuild({ production });
      break;
    }

    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
  buncf - CLI para Build de apps Bun para Cloudflare Workers

  Uso:
    bunx buncf <comando> [opções]

  Comandos:
    init                🚀 Inicializa a configuração do projeto (wrangler.jsonc + config).
    build              📦 Transpila e bundla seu worker para produção.
    build --production 🚀 Build otimizado (minify + drop console + sem sourcemaps).
    help               ❓ Exibe esta mensagem de ajuda.

  Configuração:
    A configuração é carregada automaticamente de 'buncf.config.ts' ou 'cloudflare.config.ts'.
    
    Opções principais:
      - entrypoint: Entrada do seu worker (padrão: ./src/index.ts)
      - outdir: Diretório de saída (padrão: ./dist)
      - target: Ambiente de execução ("browser", "bun", "node")
      - minify: Ativar minificação (boolean ou objeto granular)
      - sourcemap: Tipo de sourcemap ("linked", "inline", "external", "none")
      - define: Constantes de build
      - external: Módulos externos (não incluídos no bundle)
      `);
      break;
  }
}

try {
  await main();
} catch (err) {
  console.error("[buncf] ❌ Uncaught error:", err);
  process.exit(1);
}
