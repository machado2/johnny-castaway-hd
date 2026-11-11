# Johnny Castaway HD — restauração piloto

Experiência independente da [reconstrução original](https://github.com/machado2/johnny-castaway). Este repositório não altera nem publica sobre castaway.fbmac.net.

O piloto atual aplica acabamento novo à geometria extraída do original: ilha, sombra, coqueiro, céu/mar e 28 poses de Johnny. A cena usa 25 dessas poses em seis percursos originais, com viradas, pausas e passagem atrás do tronco. O circuito demonstrativo dura aproximadamente 20 segundos; sua seleção e ordem são próprias deste piloto.

## Ver localmente

Requer Node.js, sem dependências npm:

```text
npm start
```

Abra [a cena animada](http://127.0.0.1:4174/) ou a [comparação sincronizada: original à esquerda, restauração à direita](http://127.0.0.1:4174/?view=compare). A página exibe somente o canvas. Todos os arquivos são locais, e o servidor escuta apenas em 127.0.0.1.

A [comparação de bordas A/B/C](http://127.0.0.1:4174/?view=edges) mostra o recorte anterior, tolerância pequena e tolerância maior, com a mesma arte e o mesmo movimento. Também há [oito poses nas três versões](http://127.0.0.1:4174/?view=edge-poses&t=0) e [três cenas completas](http://127.0.0.1:4174/?view=edge-scenes). A opção C é o padrão atual. `?edges=strict` reproduz o tratamento anterior; `?edges=small` mostra a margem menor.

O enquadramento mantém escala uniforme em Full HD, ultrawide, tablet e celular. Só o fundo ocupa a área adicional; ilha, personagem e objetos não são esticados. A animação pausa quando a página fica oculta.

O [estudo da caminhada lateral](http://127.0.0.1:4174/walk-study.html) compara os pixels originais com uma caminhada contínua, em câmera fixa. Os pés mantêm apoio no chão, as pernas preservam sua identidade no cruzamento e a pintura não troca durante o passo. Há [câmera lenta](http://127.0.0.1:4174/walk-study.html?speed=slow) e [oito fases do ciclo](http://127.0.0.1:4174/walk-study.html?view=phases&t=0). O movimento permanece separado da cena principal. A gravação teve baixa frequência nesta sessão e a revisão em primeiro plano ficou pendente; veja evidências e limites em [ESTUDO-CAMINHADA.md](ESTUDO-CAMINHADA.md).

## Como a compatibilidade da cena principal é mantida

- Os desenhos originais são alvos de edição, com posições, margens e poses registradas. Não se recentralizam os quadros pelo tamanho do personagem.
- A transparência da arte gerada é preservada dentro de uma faixa ao redor do contorno original. O renderizador apenas reduz sua opacidade nas bordas e nos halos fracos; não transforma franjas semitransparentes em regiões opacas nem põe o original borrado por baixo. Esse preenchimento antigo existe somente na opção A de comparação.
- Os limites escolhidos na opção C são 2 pixels originais para ilha e personagem, e 1 para o coqueiro. A opção B usa 1, 0,5 e 0,65 respectivamente. Espaços entre membros/folhas e a faixa inferior do personagem têm limite mais estreito, de 0,25 pixel; sombras cinzentas têm tratamento separado. Esses limites não dependem da resolução da tela.
- Recortes com margem de 4 pixels originais preservam o ponto de desenho e o espelhamento. As posições das rotas não mudam. Não há recentralização dos sprites, ajuste automático de pernas ou deslocamento do corpo.
- O mar conserva as grandes regiões de cor e ondas do original; a pintura gerada contribui textura e uma pequena parcela da cor. O horizonte permanece alinhado. A ondulação demonstrativa é discreta e não reproduz ainda toda a sequência de água original.
- Índices dos quadros, posições, espelhamentos e regra de profundidade vêm das tabelas extraídas de SCRANTIC. A composição da ilha e do coqueiro usa BACKGRND.BMP; personagem e fundo usam JOHNWALK.BMP e OCEAN00.SCR.

A cena principal acompanha a atualização da tela, mas **mantém a cadência das poses originais**. Os intermediários existem somente na página separada de estudo; não foram promovidos a padrão.

## Revisão e testes

```text
npm test
```

Dezessete testes específicos cobrem as seis rotas, viradas, profundidade, cobertura das poses, integridade dos arquivos, enquadramento, contornos, opacidade, alinhamento e propriedades do novo ciclo contínuo, incluindo apoio dos pés e ausência de saltos de posição. Os dez testes antigos permanecem como verificações do primeiro piloto; não validam a qualidade visual desta restauração nem do novo estudo.

[VALIDACAO.md](VALIDACAO.md) registra observações e limites. A faixa comprova um limite de alteração do contorno, não identidade perfeita do rosto nem posicionamento exato de todo detalhe interno. A comparação visual continua necessária. Os detalhes desta revisão estão em [COMPARACAO-BORDAS.md](COMPARACAO-BORDAS.md).

Para congelar um instante, acrescente `?t=8.4`. Para comparar as oito poses laterais use `?view=poses&t=0`; as folhas de virada podem ser inspecionadas acrescentando `&group=turn-a` até `turn-e`. Diagnósticos somente de leitura: `window.castawayFidelity.status`.

## Arte, rastreabilidade e escopo

Os arquivos ativos estão em `web/dist/assets/fidelity/`. `source.json` registra a extração e o posicionamento; `restored.json` registra imagens selecionadas, dimensões efetivas e hashes. Os [prompts](art/FIDELITY-PROMPTS.md) e [origens das gerações](art/fidelity-provenance.json) documentam o processo. Os PNG gerados foram copiados sem edição; máscaras e composição são aplicadas no renderizador.

`npm run assets:extract` reextrai as referências a partir dos recursos decodificados no projeto original vizinho. `npm run assets:manifest` atualiza somente os metadados da arte selecionada. Ambos requerem Python e Pillow; não são necessários para executar a cena.

A versão anterior com membros articulados está preservada no histórico/tag `v0.1.0-pilot`. Seus arquivos `pilot.js` e `assets/pilot/` não são carregados pela página atual. Esta cena se limita à caminhada: ainda não restaura pesca, catálogo completo, capítulos, calendário, áudio ou história. A ampliação completa continua no [plano](PLANO-REMASTERIZACAO.md).

Johnny Castaway e os recursos originais são conteúdo Sierra/Dynamix. Os detalhes recriados são interpretações de acabamento, não recuperação comprovada de informação perdida. Nenhuma outra reimplementação foi consultada.
