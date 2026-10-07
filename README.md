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
│   ├── poi.js              pontos de interesse do mapa (benches, stags, vendedores, NPCs, springs…)
│   ├── icons.js / art.js   ícones e ilustrações SVG originais (procedurais)
│   ├── worldmap.js         mapa interativo esquemático
│   ├── state.js            state manager único (localStorage, export/import JSON versionado, reset)
│   ├── roadmap.js          engine: dependências, completion 112%, progresso por região, Next Objective
│   ├── save-importer.js    leitor do save real do PC (user#.dat) — decodifica localmente
│   ├── audio.js            trilha por região (arquivos seus + ambiência original gerada)
│   └── app.js              UI: views, trackers, Save Editor, busca, filtros, partículas
├── assets/audio/           coloque aqui o seu ambience.mp3
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

## Mapa detalhado e arte (imagens suas)

Em **World Map → Your images** (ou Tools & Settings):

- **Detailed map** — carregue uma imagem completa do mapa. Se ela tiver o layout 4712×3500 (mesma proporção, qualquer
  resolução), tudo é calibrado automaticamente (`js/mapimg.js` guarda só números: áreas clicáveis, âncoras e a posição de
  benches, stag stations, trams, roots, cocoons, hot springs e 42 grubs, obtidas casando os ícones da legenda da imagem).
  Outras imagens podem ser alinhadas à mão.
- Alterne **Clean** (mapa redesenhado) / **Detailed** (sua imagem) e use os atalhos **Everything · Stations · Benches ·
  Vendors · Bosses · Collectibles · Image only**.
- **Map of Hallownest art** — uma ilustração sua usada como fundo da página e/ou banner do Dashboard, com visualizador.

As imagens ficam só no IndexedDB do seu navegador; nunca vão para o repositório.

## Trilha sonora por região

O player (canto inferior esquerdo; no celular, barra flutuante embaixo) toca uma trilha **por região** e troca
sozinho quando você muda de região, abre uma região ou seleciona uma no mapa (botão 📍 “follow”).
Ordem de prioridade para cada região:

1. arquivo **seu** carregado na página **Soundtrack** para aquela região (fica só no IndexedDB do seu navegador — nunca é enviado nem publicado; funciona no celular);
2. arquivo seu carregado como “All regions”;
3. `assets/audio/regions/<id-da-região>.mp3` (cópia local sua, ignorada pelo git);
4. `assets/audio/ambience.mp3` (cópia local sua, ignorada pelo git);
5. **ambiência original gerada no navegador** (Web Audio): escala, andamento, timbre e textura diferentes por região
   (chuva na City of Tears, vento nos Howling Cliffs, gotas nos Royal Waterways, caixinha de música no White Palace…).

Nenhuma faixa da trilha oficial é incluída, baixada ou redistribuída. Navegadores bloqueiam autoplay: clique ▶.

## Mapa interativo

`#/map` (e o painel do Dashboard): mapa **original redesenhado sala por sala** (`js/mapgeo.js`), seguindo a geografia
real das áreas e sub-áreas (King's Pass, Soul Sanctum, Mantis Village, Distant Village, Palace Grounds…), mas sem copiar
o mapa oficial nem o do MapGenie. Arrastar/zoom até 10×/pinça, busca de locais, tela cheia, “Mark as found” para
benches/estações/vendedores (salvo no progresso) e “Hide found”,
status por região (Completed / Current / Accessible / Locked) e camadas: Benches (50), Stag Stations (11),
vendedores e serviços, bosses, Whispering Roots, Hot Springs, trams, Cornifer, Lifeblood Cocoons, NPCs, marcos e
“itens que faltam”. Clique num marcador para ver detalhes e marcar o item. A região de cada ponto é exata; a posição
dentro da região é aproximada. Dados em `js/poi.js` (fontes: hollowknight.wiki — Bench, Save Points, Stag Station,
Cornifer, Lifeblood Cocoon, Hot Spring, Tram e páginas de área).

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
