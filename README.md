# Hallownest Companion — Hollow Knight 112% Journey

Companion pessoal para acompanhar uma run de Hollow Knight até 112%, os finais e o conteúdo opcional.
HTML + CSS + JavaScript vanilla. Sem build, sem backend, sem frameworks.

A pergunta central que o site responde: **“O que eu faço agora?”**

---

## Como abrir

**Opção 1 — duplo clique:** abra `index.html` no navegador (Chrome, Edge, Firefox, Safari). Funciona via `file://`.

**Opção 2 — servidor local (recomendado se o navegador bloquear algo em `file://`):**

```bash
cd hollow-knight-companion
python3 -m http.server 8000
# abra http://localhost:8000
```

O progresso fica salvo automaticamente no `localStorage` daquele navegador (e daquela origem:
`file://` e `http://localhost` são “caixas” separadas — use sempre o mesmo jeito de abrir, ou faça Export/Import).

## Estrutura

```
hollow-knight-companion/
├── index.html              shell da aplicação (sidebar, topbar, modal)
├── css/style.css           visual Hallownest, temas por região, responsivo, prefers-reduced-motion
├── js/
│   ├── data.js             BASE DE DADOS (regiões, estágios do roadmap, 225 itens, farms, marcos da Seer)
│   ├── poi.js              pontos de interesse por região (benches, stags, vendedores, NPCs, springs…)
│   ├── icons.js / art.js   ícones e ilustrações SVG originais (procedurais)
│   ├── sync.js             sincronização opcional entre aparelhos (Gist privado)
│   ├── state.js            state manager único (localStorage, export/import JSON versionado, reset)
│   ├── roadmap.js          engine: dependências, completion 112%, progresso por região, Next Objective
│   ├── save-importer.js    leitor do save real do PC (user#.dat) — decodifica localmente
│   ├── audio.js            trilha oficial por região (player embutido do Spotify)
│   └── app.js              UI: views, trackers, Save Editor, busca, filtros, partículas
├── assets/icons/           favicon
├── tools/
│   ├── audit.js            auditoria programática: soma oficial = 112
│   └── make_test_save.py   gera um user.dat sintético para testar o importador
└── tests/
    ├── run-node-tests.js   testes unitários (engine, estado, importador, AES)
    ├── e2e_functional.py   69 checagens no navegador (Playwright)
    ├── e2e_smoke.py        screenshots desktop/mobile + erros de console
    └── fixtures/user-test.dat
```

## Mesmo progresso no computador, celular e notebook

O site fica online no GitHub Pages (https://athoskolling.github.io/Hollow-Thingy/). O que fica **local** é o progresso:
cada navegador guarda o seu no `localStorage`. Para compartilhar entre aparelhos, o site sincroniza com um **Gist
privado** na sua própria conta do GitHub (sem servidor nosso):

1. Abra https://github.com/settings/tokens/new?scopes=gist (Settings → Developer settings → Personal access tokens →
   Tokens (classic) → Generate new token). Marque **só “gist”**, escolha a validade e clique em *Generate token*.
2. Copie o token (`ghp_…`).
3. No site: **My Save → Sync between devices** → cole o token → **Connect**. Na primeira vez ele cria o Gist com o seu
   progresso.
4. Repita o passo 3 no celular e no notebook com o mesmo token — o site encontra o Gist e carrega o progresso.

Sincroniza ao abrir o site, ao voltar para a aba e alguns segundos depois de cada mudança; se dois aparelhos mudaram,
vale o salvamento mais recente. O token fica só naquele navegador; dá para revogá-lo no GitHub a qualquer momento.
Export/Import JSON continua disponível como backup manual.

## Atualizar o site

Qualquer `git push` para a branch `main` republica o GitHub Pages em ~1 minuto (Settings → Pages: *Deploy from a branch*,
`main`, `/ (root)`).

## Trilha sonora (oficial, via Spotify)

Cada região toca a sua faixa da trilha oficial de Christopher Larkin pelo **player do próprio Spotify**
(nada é baixado nem hospedado aqui). O player troca de faixa quando a região atual muda — ou ao abrir uma região,
com o botão “follow” ligado. Faixas completas tocam quando você está **logado no Spotify** naquele navegador; sem login,
o Spotify toca prévias de 30 s. Região → faixa segue a wiki (*Soundtrack (Hollow Knight)*); regiões sem faixa própria
no álbum usam a mais próxima e a página **Soundtrack** explica qual.

## Como alterar os dados

Tudo é renderizado a partir de `js/data.js`. Cada item tem o formato:

```js
I('crystal-heart', 'Crystal Heart', 'ability', 'crystal-peak', 2, {
  tags: ['progression', 'skill'], stage: 's-peak', goal: true, prio: 10,
  req: ['mantis-claw', 'mothwing-cloak'],   // requisitos obrigatórios (todos)
  any: [],                                   // alternativas (pelo menos um)
  soft: { essence: 1800 },                   // condições numéricas (só avisam, nunca bloqueiam)
  cost: { geo: 0, ore: 0 },
  loc: '...', how: '...', fn: '...', unlocks: [...], wiki: '...',
  optional: false, beyond: false,
  save: { pd: 'hasSuperDash' }               // mapeamento para o importador de save
});
```

- `completion` (0 | 1 | 2) é **somente** a contribuição oficial ao 112%.
- Itens `derived` (Ancient Mask #1–4, Soul Vessel #1–3, slot Grimmchild/Carefree, NKG/Banishment, Black Egg) são calculados automaticamente.
- Depois de editar, rode `node tools/audit.js` — ele falha se a soma não for exatamente 112, se houver ids duplicados ou referências quebradas.

## Completion × Checklist

- **Completion**: só o que conta oficialmente (wiki “Completion (Hollow Knight)”). Soma auditada = **112**.
- **Checklist**: tudo que o guia acompanha (214 itens marcáveis), incluindo opcionais, Whispering Roots, chaves, NPCs e Beyond 112%.

## Roadmap adaptativo / Next Objective

O Next Objective considera: o que já está feito (e o que fica **implícito** — ex.: Monarch Wings marcado implica Broken Vessel),
requisitos disponíveis, ordem recomendada (estágios), importância, região atual (“While you’re here” antes de mandar sair),
contribuição ao 112%, Geo disponível e condições numéricas (Essence, Grubs, Charms, Simple Key em mãos).
Você pode **fixar** (📌) qualquer item como objetivo.

Nada é bloqueado. Se o estado parecer inconsistente aparece
«⚠️ Seu save indica que talvez algum requisito anterior não tenha sido registrado.» com um botão para marcar os pré-requisitos implícitos.

**Regra do Void Heart:** enquanto “ENDING: The Hollow Knight” não estiver marcado, o site mostra
🔒 **VOID HEART — NÃO PEGUE AINDA**, nunca recomenda o Void Heart e pede confirmação se você tentar marcá-lo.
Depois do final: 🔓 **VOID HEART — AGORA É SEGURO**.

## Backup / Import / Export

Em **Save & Backup**:

- **EXPORT PROGRESS → JSON** — baixa um arquivo com `"app": "hollow-knight-companion"` e `"version": 1`.
- **IMPORT PROGRESS ← JSON** — valida versão e ids; arquivos inválidos são rejeitados sem tocar no progresso.
- **Reset** — pede confirmação dupla.

## Save Importer (save real do PC)

**Status: funcional (beta).** Escolha `user1.dat`…`user4.dat`:

| SO | Pasta |
|---|---|
| Windows | `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight\` |
| macOS | `~/Library/Application Support/unity.Team Cherry.Hollow Knight/` |
| Linux | `~/.config/unity3d/Team Cherry/Hollow Knight/` |

Formato (o mesmo usado pelos projetos open-source *bloodorca/hollow* e *ReznoRMichael/hollow-knight-completion-check*):
cabeçalho C# BinaryFormatter (22 bytes) + tamanho 7-bit + Base64 → AES-256-ECB (chave pública do jogo) → PKCS#7 → JSON
(`playerData` + `sceneData.persistentBoolItems`). A decodificação roda 100% no navegador (AES implementado em JS, validado
com o vetor FIPS-197); o arquivo só é lido, nunca alterado nem enviado.

Fluxo: arquivo → preview **SAVE DETECTED** (habilidades, Essence, Geo, nail, charms, shards, Dreamers) → lista de mudanças
com checkbox para cada uma → **APPLY TO ROADMAP**. Nada muda sem confirmação.

Limitações do importador:
- Testado com um save sintético gerado no formato oficial — não com o seu save real. Revise o preview.
- Campos ausentes (versões antigas do jogo) ou não mapeados ficam como estão (o preview informa quantos).
- Grubs são importados só como número (o save não mapeia grubs individuais aqui).
- O final “The Hollow Knight” só é inferido se o Hollow Knight foi derrotado **sem** Void Heart; caso contrário, marque manualmente.
- Alguns flags (Hallownest Seal / Dreamgate da Seer, salas específicas) não são importados.
- Saves de console (Switch/PS/Xbox) não são suportados.

## Testes

```bash
node tools/audit.js                 # auditoria 112%
node tests/run-node-tests.js        # 17 testes unitários
python3 tools/make_test_save.py     # (re)gera tests/fixtures/user-test.dat — precisa de `cryptography`
python3 -m http.server 8765 &       # e depois:
python3 tests/e2e_functional.py     # 69 checagens no navegador — precisa de `playwright` + Chromium
```

## Limitações conhecidas (V1)

- Grubs: contador 0–46 com as recompensas do Grubfather; as 46 localizações individuais ficam no link da Wiki.
- Localizações dos Grimmkin são por área (a Wiki mostra os pontos só em imagens de mapa).
- Valores de farm de Geo: só Colosseum e relíquias são números verificados; o resto é estimativa qualitativa.
- Fontes vêm do Google Fonts; offline, o site usa fontes de sistema.
- Essence é um número manual (gasto com Dreamgate não é rastreável automaticamente).

## Auto-sync no futuro

O importador já faz o trabalho pesado. Próximos passos possíveis: usar a File System Access API (Chrome/Edge) para
“observar” o `user#.dat` e reimportar a cada save no banco, ou um pequeno app local que exponha o JSON do save.
Em ambos os casos a confirmação de mudanças continuaria obrigatória.

---

Dados: [hollowknight.wiki](https://hollowknight.wiki/) (CC BY-SA). Projeto de fã, sem afiliação com a Team Cherry.
Nenhum asset oficial é incluído.
