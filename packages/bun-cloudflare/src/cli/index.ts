#!/usr/bin/env bun
import { runBuild } from "./build";

/**
 * CLI Entry point for bun-cloudflare.
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
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
  bun-cloudflare - CLI para Build de apps Bun para Cloudflare Workers

  Uso:
    bunx bun-cloudflare <comando> [opções]

  Comandos:
    build              📦 Transpila e bundla seu worker para produção.
    build --production 🚀 Build otimizado (minify + drop console + sem sourcemaps).
    help               ❓ Exibe esta mensagem de ajuda.

  Configuração:
    A configuração é carregada automaticamente de 'buncloudflare.config.ts' ou 'cloudflare.config.ts'.
    
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
  console.error("[bun-cloudflare] ❌ Uncaught error:", err);
  process.exit(1);
}
