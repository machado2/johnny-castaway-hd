# Johnny Castaway HD — restauração piloto

Experiência independente da [reconstrução original](https://github.com/machado2/johnny-castaway). Este repositório não altera nem publica sobre castaway.fbmac.net.

[Abrir a prévia HD pública](https://machado2.github.io/johnny-castaway-hd/). O endereço funciona sem servidor local. A publicação pelo GitHub Pages usa este repositório e preserva os quadros completos e a cadência original.

O piloto atual mostra a pesca completa `FISHING.ADS`, sequência 2: Johnny pega a vara, caminha até a borda, lança a linha, captura o peixe e retorna. São 82 poses completas restauradas, três ondulações da captura e os sons originais, além do cenário e da caminhada já aprovados. As 352 apresentações do roteiro mantêm os tempos e as posições originais (19,36 s). Uma pausa e uma virada das tabelas originais fecham o ciclo demonstrativo de 22,11 s. Toque no canvas para habilitar os sons.

A [caminhada aprovada continua disponível](https://machado2.github.io/johnny-castaway-hd/?scene=walk). Os detalhes estão em [PESCA.md](PESCA.md). A história completa e as outras sete sequências de pesca ainda não estão integradas.

## Ver localmente

A execução local é opcional; para visualizar a prévia, prefira o endereço público acima.

Requer Node.js, sem dependências npm:

```text
npm start
```

Abra [a cena animada](http://127.0.0.1:4174/) ou a [comparação sincronizada: original à esquerda, restauração à direita](http://127.0.0.1:4174/?view=compare). A página exibe somente o canvas. Todos os arquivos são locais, e o servidor escuta apenas em 127.0.0.1.

A [comparação de bordas A/B/C](http://127.0.0.1:4174/?view=edges) mostra o recorte anterior, tolerância pequena e tolerância maior, com a mesma arte e o mesmo movimento. Também há [oito poses nas três versões](http://127.0.0.1:4174/?view=edge-poses&t=0) e [três cenas completas](http://127.0.0.1:4174/?view=edge-scenes). A opção C é o padrão atual. `?edges=strict` reproduz o tratamento anterior; `?edges=small` mostra a margem menor.

O enquadramento mantém escala uniforme em Full HD, ultrawide, tablet e celular. Só o fundo ocupa a área adicional; ilha, personagem e objetos não são esticados. A animação pausa quando a página fica oculta.

Por decisão do usuário, a restauração mantém somente os quadros completos e a cadência original. Os experimentos de interpolação e membros separados foram encerrados. O endereço antigo `walk-study.html` agora abre esta mesma cena, com o acabamento e as bordas já aprovados. O registro dessa decisão está em [ESTUDO-CAMINHADA.md](ESTUDO-CAMINHADA.md).

## Como a compatibilidade da cena principal é mantida

- Os desenhos originais são alvos de edição, com posições, margens e poses registradas. Não se recentralizam os quadros pelo tamanho do personagem.
- Na caminhada aprovada e no cenário, a transparência da arte gerada é preservada dentro de uma faixa ao redor do contorno original. O renderizador apenas reduz sua opacidade nas bordas e nos halos fracos; não transforma franjas semitransparentes em regiões opacas nem põe o original borrado por baixo. Esse preenchimento antigo existe somente na opção A de comparação.
- Nessa caminhada, os limites da opção C são 2 pixels originais para ilha e personagem, e 1 para o coqueiro. A opção B usa 1, 0,5 e 0,65 respectivamente. Espaços entre membros/folhas e a faixa inferior do personagem têm limite mais estreito, de 0,25 pixel; sombras cinzentas têm tratamento separado. Esses limites não dependem da resolução da tela.
- As 82 poses completas da pesca preservam a transparência do próprio desenho gerado. Não recebem a silhueta pixelada como máscara, que cortava cabeça, braços, pernas e objetos quando os contornos não coincidiam. Somente franjas com alpha abaixo de 64/255 são atenuadas. O registro da imagem inteira na caixa original, as coordenadas e os tempos continuam iguais; não se promete coincidência de cada detalhe da silhueta gerada com os pixels originais.
- Recortes com margem de 4 pixels originais preservam o ponto de desenho e o espelhamento. As posições das rotas não mudam. Não há recentralização dos sprites, ajuste automático de pernas ou deslocamento do corpo.
- O mar conserva as grandes regiões de cor e ondas do original; a pintura gerada contribui textura e uma pequena parcela da cor. O horizonte permanece alinhado. A ondulação demonstrativa é discreta e não reproduz ainda toda a sequência de água original.
- Índices dos quadros, posições, espelhamentos e regra de profundidade vêm das tabelas extraídas de SCRANTIC. A composição da ilha e do coqueiro usa BACKGRND.BMP; personagem e fundo usam JOHNWALK.BMP e OCEAN00.SCR.

A apresentação acompanha a atualização da tela, mas **mantém a quantidade de quadros e a cadência das poses originais**. Cada quadro mostra o personagem inteiro, sem articulação por partes, interpolação ou dissolução entre poses.

## Revisão e testes

```text
npm test
```

A suíte tem 37 testes: 27 cobrem caminhada, bordas, pesca, áudio, integridade e enquadramento; dez permanecem como verificações do primeiro piloto arquivado. Esses dez não validam a qualidade visual desta restauração nem são usados para justificar animação por membros. A revisão da pesca também inspeciona as 82 poses renderizadas e verifica, no navegador, a preservação dos pixels visíveis do desenho completo; ver [PESCA.md](PESCA.md).

[VALIDACAO.md](VALIDACAO.md) registra observações e limites. A faixa comprova um limite de alteração do contorno, não identidade perfeita do rosto nem posicionamento exato de todo detalhe interno. A comparação visual continua necessária. Os detalhes desta revisão estão em [COMPARACAO-BORDAS.md](COMPARACAO-BORDAS.md).

Para congelar um instante, acrescente `?t=8.4`. Para comparar as oito poses laterais use `?view=poses&t=0`; as folhas de virada podem ser inspecionadas acrescentando `&group=turn-a` até `turn-e`. Diagnósticos somente de leitura: `window.castawayFidelity.status`.

## Arte, rastreabilidade e escopo

Os arquivos ativos estão em `web/dist/assets/fidelity/`. `source.json` registra a extração e o posicionamento; `restored.json` registra imagens selecionadas, dimensões efetivas e hashes. Os [prompts](art/FIDELITY-PROMPTS.md) e [origens das gerações](art/fidelity-provenance.json) documentam o processo. Os PNG gerados foram copiados sem edição; máscaras e composição são aplicadas no renderizador.

`npm run assets:extract` reextrai as referências a partir dos recursos decodificados no projeto original vizinho. `npm run assets:manifest` atualiza somente os metadados da arte selecionada. Ambos requerem Python e Pillow; não são necessários para executar a cena.

A versão anterior com membros articulados está preservada no histórico/tag `v0.1.0-pilot`. Seus arquivos `pilot.js` e `assets/pilot/` não são carregados pela página atual. O piloto cobre a caminhada e uma sequência completa de pesca; catálogo completo, capítulos, calendário e progressão da história continuam no [plano](PLANO-REMASTERIZACAO.md).

Johnny Castaway e os recursos originais são conteúdo Sierra/Dynamix. Os detalhes recriados são interpretações de acabamento, não recuperação comprovada de informação perdida. Nenhuma outra reimplementação foi consultada.
