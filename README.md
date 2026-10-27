# Controle de Qualidade RDC 611

Coletor de campo para os ensaios de controle de qualidade das Instruções
Normativas nº 90 a 97/2021, da RDC nº 611/2022 da ANVISA.

Aplicativo web instalável (PWA): funciona sem rede depois de instalado, e a
coleta fica no próprio aparelho. Sem framework, sem dependência externa, sem
build — o que está no repositório é o que roda.

Ao fechar a visita, o coletor exporta uma **planilha .xlsx** com tudo o que
foi medido — uma visita, um arquivo, que vai para Arquivos, Drive ou e-mail
pela folha de compartilhamento do aparelho. O `localStorage` continua sendo a
memória de trabalho, que grava sozinha a cada toque; a planilha é o que o
físico leva embora e o que alimentará o banco depois.

Cada visita tem duas partes: a **vistoria**, que registra as condições de
proteção radiológica da sala — sinalização luminosa, símbolo na porta, avisos,
vestimentas plumbíferas, biombo, dosimetria e documentação —, e os **ensaios**
do Anexo I da Instrução Normativa da modalidade. A vistoria não tem tolerância
nem instrumento, e mesmo assim entra no laudo: é o que a autoridade sanitária
olha primeiro. No coletor de ultrassom ela existe com outra lista, porque não
há radiação ionizante a sinalizar.

## Estrutura

```
app/                        o aplicativo publicado
  index.html                casca: lançador, cadastros, relatórios
  coletor-rx-in90.html      coletor de radiografia convencional (IN 90)
  coletor-odi-in95.html     coletor de odontologia intraoral (IN 95)
  coletor-us-in96.html      coletor de ultrassom (IN 96)
  base/cadastro.js          clientes, equipamentos, modalidades e conjunto emissor
  base/xlsx.js              gerador de planilha .xlsx, sem dependência
  base/semente.js           acervo inicial de demonstração (gerado)
  sw.js                     service worker, cache-first
  manifest.webmanifest      instalação e ícone
  icones/                   192, 512, maskable, apple-touch, favicon
  ferramentas/              scripts de mesa, não vão para o aparelho
```

## Rodar localmente

```
npm run dev
```

Ou, sem npm, `node app/ferramentas/servir.mjs` — é o que o script chama. Não há
`npm install` a fazer: o `package.json` existe só pelos atalhos, e o projeto não
tem dependência nenhuma.

Serve em `http://localhost:8080` e imprime também o endereço da rede local,
que é como o celular alcança o notebook. **Servidor é necessário**: service
worker não registra em `file://`.

## Ferramentas de mesa

```
npm run icones     reescreve icones/ (SDF, sem dependência)
npm run semente    reextrai base/semente.js dos coletores
```

`app/ferramentas/prova-icones.html` mostra os oito ícones de modalidade em 96,
46 e 26 px — um ícone que só funciona grande não serve.

## Ao acrescentar uma modalidade

1. Criar `app/coletor-<sigla>-in<NN>.html`.
2. Preencher `arquivo:` na modalidade correspondente em `base/cadastro.js`.
3. Acrescentar o arquivo à lista `RECURSOS` em `app/sw.js`.
4. **Incrementar `VERSAO` em `app/sw.js`** — sem isso o aparelho continua
   servindo o pacote anterior indefinidamente.
5. Gravar `visita.resumo` no mesmo formato do coletor de raios X, e declarar
   a chave de gravação em `chave`, na modalidade (`base/cadastro.js`) — sem os
   dois a modalidade não aparece na tabela de relatórios da casca.
6. Se a modalidade tem tubo de raios X, incluir o número em
   `MODALIDADES_COM_TUBO` (`base/cadastro.js`): o bloco de conjunto emissor —
   modelo e série do tubo, ano, kVp e mA máximos, filtração total — passa a
   aparecer sozinho na tela de cadastro.

Durante o desenvolvimento o mesmo cache esconde as edições. Se uma mudança não
aparece no navegador, é o service worker servindo o pacote anterior: desregistre
e limpe os caches antes de concluir que o código está errado.

A casca e os três coletores mostram **"há uma versão mais recente · Atualizar"**
quando o worker novo instala e fica em espera. O `install` não chama
`skipWaiting` de propósito — trocar o app por baixo de quem está no meio de um
ensaio é pior que ficar uma visita com a versão anterior —, então quem decide é
quem está usando. O aviso só aparece para aparelhos que já tenham uma versão
**com o aviso**: a primeira atualização depois de acrescentá-lo ainda precisa de
limpeza à mão.

## Publicação

Netlify, sem build: o que se publica é a pasta `app/`.

Hoje o site é atualizado **arrastando `app/` no Netlify Drop**. Nesse fluxo o
`git push` não publica nada — ele só guarda o código no GitHub. Para que o push
passasse a publicar sozinho, o site precisaria ser ligado ao repositório nas
configurações do Netlify; aí o `netlify.toml` da raiz passaria a valer, com
`publish = "app"`.

Os cabeçalhos ficam em `app/_headers`, e não no `netlify.toml`, justamente para
valerem também quando a pasta é arrastada sozinha: é lá que o service worker, o
manifesto e os arquivos de `base/` são marcados como sem cache, para que uma
versão nova chegue aos aparelhos já instalados.

## Situação

| IN | Modalidade | Coletor |
|----|------------|---------|
| 90 | Radiografia médica convencional | pronto — 33 ensaios |
| 96 | Ultrassom diagnóstico | pronto — 13 testes |
| 95 | Radiologia odontológica intraoral | pronto — 15 ensaios |
| 94 | Radiologia odontológica extraoral | a fazer |
| 91 | Fluoroscopia e radiologia intervencionista | a fazer |
| 92 | Mamografia | a fazer |
| 93 | Tomografia computadorizada | a fazer |
| 97 | Ressonância magnética nuclear | a fazer |

Demonstração técnica. Os valores de referência dos instrumentos e a
identificação do serviço emissor devem ser conferidos antes de qualquer uso em
campo.

## Ferramentas do serviço

O aplicativo é vendido a vários serviços de física médica, e cada um tem o seu
parque de medição. Em **Ferramentas**, dois destinos: **Medidores** e
**Fantomas** — medidor mede, fantoma é imageado, e é assim que quem usa os
procura.

O ensaio declara de que **tipo** de ferramenta precisa; o coletor usa a que o
serviço cadastrou daquele tipo. Trocar a câmara de ionização por outra não
mexe em ensaio nenhum. Cada ferramenta guarda o certificado — número,
laboratório, data, validade e rastreabilidade — e o arquivo do certificado, em
IndexedDB, porque um PDF de 2 MB não cabe nos ~5 MB de texto do `localStorage`.

Os coeficientes de correção são **por qualidade de feixe**, como vêm no
certificado, e o coletor escolhe pela tensão do ensaio: interpola entre as
linhas vizinhas e não extrapola fora da faixa calibrada. Um único N aplicado a
todas as tensões é erro sistemático introduzido pelo próprio controle de
qualidade. Ensaio sem tensão declarada usa o primeiro coeficiente da lista.
Fantoma não tem coeficiente — não corrige leitura nenhuma —, e a seção não
aparece no cadastro dele.

## A planilha exportada

Duas colunas: o rótulo na **A**, o valor na **B**. Cabeçalho do cliente,
cadastro do equipamento, conjunto emissor, vistoria item a item e um bloco por
ensaio, na ordem do roteiro — o nome do ensaio abre em negrito e as medidas
vêm recuadas embaixo. É a leitura de uma folha de campo, e se confere de bater
o olho.

A unidade entra no rótulo, e não numa coluna à parte: assim a coluna B fica só
com o que foi medido ou cadastrado — número onde é número, texto onde é texto.

`base/xlsx.js` gera o arquivo à mão: monta os XMLs e fecha o ZIP sem compressão,
em ~200 linhas, para não trazer a primeira dependência do projeto. Faz texto,
número, faixa de seção, rótulo em negrito e largura de coluna — nada de
fórmula, estilo por célula ou várias abas. Número vai gravado como número,
então não há briga de vírgula contra ponto: o Excel em português lê `57.4` do
XML e mostra `57,4`.

O que a planilha guarda é a **leitura bruta**. O resultado consolidado vai junto
por conveniência, mas é derivado — ao reimportar, recalcule. Se uma tolerância
mudar, a conta muda e o arquivo antigo continua correto no que importa.

Nenhum navegador deixa uma página gravar em disco sozinha, e no iOS não existe
pedir uma pasta uma vez. Por isso a exportação precisa partir de um toque, e usa
a folha de compartilhamento quando o aparelho a oferece, caindo no download onde
não oferece.

## Direitos

© 2026 Gabriel Cecci Tardioli. Todos os direitos reservados.

O código está público para consulta e avaliação. Não há licença de uso: copiar,
modificar, redistribuir ou usar comercialmente exige autorização do autor.
