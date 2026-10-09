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
│   ├── guide.js            guia de bosses (HP, ataques, dicas), árvores de Essence e itens perdíveis — cada entrada com link da Wiki
│   ├── poi.js              pontos de interesse por região (benches, stags, vendedores, NPCs, springs…)
│   ├── icons.js / art.js   ícones e ilustrações SVG originais (procedurais)
│   ├── cloud.js            conta + login (Google/GitHub/e-mail) e sync ao vivo via Firebase (opcional)
│   ├── firebase-config.js  config pública do seu projeto Firebase (vazio por padrão)
│   ├── sync.js             sincronização antiga entre aparelhos (Gist privado)
│   ├── state.js            state manager único (localStorage, export/import JSON versionado, reset)
│   ├── roadmap.js          engine: dependências, completion 112%, progresso por região, Next Objective
│   ├── save-importer.js    leitor do save real do PC (user#.dat) — decodifica localmente
│   ├── audio.js            trilha oficial por região (player embutido do Spotify)
│   └── app.js              UI: views, trackers, Save Editor, busca, filtros, partículas
├── assets/icons/           favicon
├── assets/bg/              artworks do carrossel de fundo (js/bg.js, troca a cada 20 s)
├── tools/
│   ├── audit.js            auditoria programática: soma oficial = 112
│   └── make_test_save.py   gera um user.dat sintético para testar o importador
└── tests/
    ├── run-node-tests.js   testes unitários (engine, estado, importador, AES)
    ├── e2e_functional.py   119 checagens no navegador (Playwright)
    ├── e2e_smoke.py        screenshots desktop/mobile + erros de console
    └── fixtures/user-test.dat
```

## Mesmo progresso no computador, celular e notebook

> Recomendado: **conta com login** (seção “Conta e login (Firebase)” mais abaixo). O método do Gist, descrito aqui, continua disponível como alternativa.

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
node tests/run-node-tests.js        # 29 testes unitários
python3 tools/make_test_save.py     # (re)gera tests/fixtures/user-test.dat — precisa de `cryptography`
python3 -m http.server 8765 &       # e depois:
python3 tests/e2e_functional.py     # 119 checagens no navegador — precisa de `playwright` + Chromium
```

## Limitações conhecidas (V1)

- Grubs: contador 0–46 com as recompensas do Grubfather; as 46 localizações individuais ficam no link da Wiki.
- Localizações dos Grimmkin são por área (a Wiki mostra os pontos só em imagens de mapa).
- Valores de farm de Geo: só Colosseum e relíquias são números verificados; o resto é estimativa qualitativa.
- Fontes vêm do Google Fonts; offline, o site usa fontes de sistema.
- Árvores de Essence: a Wiki só dá a localização em nível de área (não por coordenada); o site mostra exatamente isso, com link — nada inventado.
- Guia de bosses: HP varia com o nível da Nail e com fases; só entram números que a Wiki confirma, o resto fica em branco.
- Perfis de save: o sync por Gist cobre só o perfil “Main save” (os outros ficam apenas neste navegador; use Export JSON para levá-los).
- Essence é um número manual (gasto com Dreamgate não é rastreável automaticamente).

## Auto-sync no futuro

O importador já faz o trabalho pesado. Próximos passos possíveis: usar a File System Access API (Chrome/Edge) para
“observar” o `user#.dat` e reimportar a cada save no banco, ou um pequeno app local que exponha o JSON do save.
Em ambos os casos a confirmação de mudanças continuaria obrigatória.

---

Dados: [hollowknight.wiki](https://hollowknight.wiki/) (CC BY-SA). Projeto de fã, sem afiliação com a Team Cherry.
Nenhum asset oficial é incluído.


## Créditos do fundo
As imagens em `assets/bg/` são artes de fãs / promocionais de Hollow Knight (© Team Cherry e respectivos artistas), escolhidas pelo dono do site e usadas apenas como papel de parede num projeto pessoal, sem fins lucrativos e sem afiliação. Para trocar: substitua os arquivos `bg-01.jpg … bg-09.jpg`; o intervalo fica em `INTERVAL` no `js/bg.js`.

## Página Map
`#/map` é um **esquema original** de Hallownest (js/atlas.js): regiões posicionadas aproximadamente, ligadas às vizinhas, com camadas (progresso, itens/charms/bosses que faltam, Stag Stations, Benches). Não é o mapa oficial nem está em escala; a página linka um mapa interativo da comunidade (Map Genie) para o mapa detalhado do jogo. Nenhuma imagem do mapa oficial é hospedada.

## Página Plan
`#/plan` reúne as ferramentas de planejamento (tudo calculado a partir do seu progresso, sem dados pré-marcados):
- **Geo planner** — o que você pode comprar agora, o que falta juntar (e quanto), o que ainda não está acessível e os opcionais.
- **Farm routes** — rotas de farm sem glitch, sugeridas pela sua % de conclusão (início / meio / fim), com onde, requisitos, dificuldade e retorno.
- **Missables** — o que dá para perder ou travar (permanente / escolha / cuidado), com fonte. Aparece também como alerta no Dashboard quando o próximo objetivo é arriscado e como aviso no detalhe do item. Nunca bloqueia checkboxes.
- **Come back later** — lista “voltar depois” (botão no detalhe de qualquer item); separa o que já dá para fazer agora.
- **Charm builds** — montador com medidor de notches (aceita overcharm, mostrando o aviso), salvar/carregar/apagar builds.
- **History** — gráfico da % ao longo dos dias (um ponto por dia de uso; gravado sem mexer no timestamp do sync).

Também: **Trackers → Boss guide** (por boss: HP, ataques, dicas, o que levar, link da Wiki), **Trackers → Essence** (as 15 Whispering Roots por região com a Essence de cada uma), **notas por região** (na página da região) e **perfis de save** (Settings; até 8, cada um com progresso próprio).

## Spotify: música inteira com a sua conta
O player embutido do Spotify só toca **prévia de 30 s** se o navegador não estiver logado no Spotify. Para tocar a **faixa inteira** da região (e repetir em loop), a página **Soundtrack** tem “Connect Spotify”:
- Usa o **Web Playback SDK** + login **PKCE** (sem backend e sem client secret). Exige **Spotify Premium** e navegador de computador (no celular o SDK geralmente não funciona — o site volta sozinho para o player embutido).
- Você cria um app grátis no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), registra como **Redirect URI** exatamente o endereço mostrado na página (ex.: `https://athoskolling.github.io/Hollow-Thingy/`), marca *Web Playback SDK* e cola o **Client ID**.
- Tokens ficam só no `localStorage` do navegador (chave `hk-companion-spotify`) — não vão para o export/JSON nem para o Gist de sync.
- Nada de áudio é baixado ou hospedado; é o próprio Spotify tocando.

## Conta e login (Firebase)
Login de verdade (Google, GitHub ou link por e-mail) e sincronização **ao vivo** entre aparelhos. O site continua estático no GitHub Pages; o Firebase só guarda o seu progresso (Auth + Firestore, plano gratuito Spark). As chaves do Firebase para web **não são segredo** — quem protege os dados são o login e o `firestore.rules` (cada usuário só lê/escreve o próprio documento `users/{uid}`).

### Configurar (uma vez)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto** (pode desligar o Analytics).
2. **Build → Authentication → Get started → Sign-in method** e ative:
   - **Google** (basta ativar);
   - **E-mail/senha** → ative também **“Link por e-mail (login sem senha)”**;
   - **GitHub**: crie um OAuth App em github.com/settings/developers → *New OAuth App*, com **Authorization callback URL** = a URL que o Firebase mostra (`https://SEU-PROJETO.firebaseapp.com/__/auth/handler`); cole o *Client ID* e o *Client secret* no Firebase.
3. **Authentication → Settings → Authorized domains** → adicione `athoskolling.github.io` (e `localhost` já vem).
4. **Build → Firestore Database → Create database** (modo produção). Aba **Rules** → cole o conteúdo de `firestore.rules` → **Publish**.
5. **Project settings (engrenagem) → Your apps → Web (`</>`)** → registre um app e copie o `firebaseConfig`.
6. Coloque a config em `js/firebase-config.js` (`window.HK_FIREBASE = {...}`) e faça push — ou cole no próprio site em **My Save → Account & sync** (fica só naquele navegador).

### Como funciona
- Entre com Google/GitHub/e-mail em **My Save**; nos outros aparelhos, o mesmo login. Sem token para colar.
- Atualiza **ao vivo** (Firestore `onSnapshot`) e ~2 s depois de cada mudança; vale o salvamento mais recente.
- **Primeira vez num aparelho**: se só um lado tem progresso, ele é usado; se os dois têm e diferem, o site pergunta — *Merge* (união dos itens marcados + maiores Geo/Essence/Grubs), *usar da conta* ou *usar deste aparelho*. Um aparelho novo e vazio **nunca** sobrescreve a nuvem.
- Só o perfil **Main save** sincroniza. “Delete my cloud copy” apaga o documento da nuvem; “Sign out” desconecta o aparelho.
- Spotify continua por aparelho (tokens nunca vão para a nuvem).
- O SDK do Firebase é carregado do `gstatic.com` só quando existe uma config.

### Deploy
O deploy segue igual: `git push` na `main` → GitHub Pages. Se um dia hospedar em outro domínio, adicione-o em *Authorized domains* e ajuste o Redirect URI do Spotify.
