# Radar Legislativo

Consulta das votações do Plenário da Câmara dos Deputados: o que foi votado, quem apresentou cada projeto e como cada deputado votou. Os dados vêm da API de Dados Abertos da Câmara e aparecem sem interpretação.

## Estrutura

- `src/radar`: coleta dos dados, acesso ao banco e API (Python, FastAPI)
- `sql/schema.sql`: tabelas do PostgreSQL
- `web`: interface (React, Vite, TypeScript)
- `tests`: testes com pytest

## Como rodar

Requisitos: Python 3.11+, Node 20+ e Docker.

    docker compose up -d
    Get-Content sql/schema.sql | docker compose exec -T db psql -U radar

    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -e ".[dev]"

    python -m radar 2026-05-01 2026-05-31
    uvicorn radar.api:app --reload

Em outro terminal:

    cd web
    npm install
    npm run dev

A interface abre em http://localhost:5173 e a documentação da API em http://localhost:8000/docs.

## Decisões sobre os dados

- O partido é gravado em cada voto, porque deputados trocam de legenda e os votos antigos não podem ser atribuídos ao partido novo.
- A coleta é idempotente: rodar o mesmo período de novo atualiza os registros sem duplicar.
- Votações simbólicas não têm voto individual e aparecem sem placar.
- Requerimentos ficam no banco, mas a lista principal mostra só projetos (PL, PEC, PLP, MPV, PDL e PRC).

## Deploy

- Banco: PostgreSQL no Neon
- API e interface: dois projetos na Vercel a partir deste repositório (raiz e pasta `web`)
- Coleta: GitHub Actions a cada 15 minutos no horário das sessões (`.github/workflows/coleta.yml`)

Site: https://radar-legislativo-home.vercel.app