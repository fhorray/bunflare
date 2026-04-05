#!/usr/bin/env bun
import { runBuild } from "./build";
import { runInit } from "./init";

/**
 * CLI Entry point for bunflare.
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "init": {
      await runInit();
      break;
    }

    case "build": {
      const args = process.argv.slice(2);
      const production = args.includes("--production") || args.includes("-p");
      const quiet = args.includes("--quiet") || args.includes("-q");
      await runBuild({ production, quiet });
      break;
    }

    case "doctor": {
      const { runDoctor } = await import("./doctor");
      await runDoctor();
      break;
    }

    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
  bunflare - CLI para Build de apps Bun para Cloudflare Workers

  Uso:
    bunx bunflare <comando> [opções]

  Comandos:
    init                🚀 Inicializa a configuração do projeto (wrangler.jsonc + config).
    build              📦 Transpila e bundla seu worker para produção.
    build --production 🚀 Build otimizado (minify + drop console + sem sourcemaps).
    build --quiet      🤫 Build silencioso (sem logs, ideal para CI/CD).
    doctor             🩺 Verifica a saúde e configuração do projeto.
    help               ❓ Exibe esta mensagem de ajuda.

  Configuração:
    A configuração é carregada automaticamente de 'bunflare.config.ts' ou 'cloudflare.config.ts'.
    
    Opções principais:
      - entrypoint: Entrada do seu worker (padrão: ./src/index.ts)
      - outdir: Diretório de saída (padrão: ./dist)
      - target: Ambiente de execução ("browser", "bun", "node")
      - minify: Ativar minificação (boolean ou objeto granular)
      - sourcemap: Tipo de sourcemap ("linked", "inline", "external", "none")
      - quiet: Suprimir logs de build (-q)
      - define: Constantes de build
      - external: Módulos externos (não incluídos no bundle)
      `);
      break;
  }
}

try {
  await main();
} catch (err) {
  console.error("[bunflare] ❌ Uncaught error:", err);
  process.exit(1);
}
