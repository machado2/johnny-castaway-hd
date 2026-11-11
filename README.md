# Johnny Castaway HD — restauração piloto

Experiência independente da [reconstrução original](https://github.com/machado2/johnny-castaway). Este repositório não altera nem publica sobre castaway.fbmac.net.

O piloto atual aplica acabamento novo à geometria extraída do original: ilha, sombra, coqueiro, céu/mar e 28 poses de Johnny. A cena usa 25 dessas poses em seis percursos originais, com viradas, pausas e passagem atrás do tronco. O circuito demonstrativo dura aproximadamente 20 segundos; sua seleção e ordem são próprias deste piloto.

## Ver localmente

Requer Node.js, sem dependências npm:

```text
npm start
```

Abra [a cena animada](http://127.0.0.1:4174/) ou a [comparação sincronizada: original à esquerda, restauração à direita](http://127.0.0.1:4174/?view=compare). A página exibe somente o canvas. Todos os arquivos são locais, e o servidor escuta apenas em 127.0.0.1.

O enquadramento mantém escala uniforme em Full HD, ultrawide, tablet e celular. Só o fundo ocupa a área adicional; ilha, personagem e objetos não são esticados. A animação pausa quando a página fica oculta.

## Como a compatibilidade é mantida

- Os desenhos originais são alvos de edição, com posições, margens e poses registradas. Não se recentralizam os quadros pelo tamanho do personagem.
- A transparência final é reconstruída a partir do contorno original, com uma faixa estreita de suavização. A geração fornece acabamento, mas não define a silhueta final. Isso preserva também os espaços entre braços, pernas e folhas.
- Pequenas lacunas da arte gerada recebem uma base de cor do original. No personagem, essa base resolve a alternância de pixels vermelhos e brancos como pele, evitando manchas vermelhas nas bordas.
- O mar conserva as grandes regiões de cor e ondas do original; a pintura gerada contribui textura e uma pequena parcela da cor. O horizonte permanece alinhado. A ondulação demonstrativa é discreta e não reproduz ainda toda a sequência de água original.
- Índices dos quadros, posições, espelhamentos e regra de profundidade vêm das tabelas extraídas de SCRANTIC. A composição da ilha e do coqueiro usa BACKGRND.BMP; personagem e fundo usam JOHNWALK.BMP e OCEAN00.SCR.

A página acompanha a atualização da tela, mas **mantém a cadência das poses originais**. Ainda não há 60 poses distintas por segundo nem interpolação entre membros. A prioridade desta revisão é corrigir fidelidade e contato com o cenário antes de criar intermediários.

## Revisão e testes

```text
npm test
```

Sete testes específicos cobrem as seis rotas, viradas, profundidade, cobertura das poses, integridade dos arquivos, independência da frequência de apresentação e enquadramento de 320×568 até 5120×1440/4K. Os dez testes antigos permanecem como verificações do estudo anterior; não validam a qualidade visual desta restauração.

[VALIDACAO.md](VALIDACAO.md) registra observações e limites. A máscara comprova compatibilidade do contorno, não identidade perfeita do rosto nem posicionamento exato de todo detalhe interno. A comparação visual continua necessária.

Para congelar um instante, acrescente `?t=8.4`. Para comparar as oito poses laterais use `?view=poses&t=0`; as folhas de virada podem ser inspecionadas acrescentando `&group=turn-a` até `turn-e`. Diagnósticos somente de leitura: `window.castawayFidelity.status`.

## Arte, rastreabilidade e escopo

Os arquivos ativos estão em `web/dist/assets/fidelity/`. `source.json` registra a extração e o posicionamento; `restored.json` registra imagens selecionadas, dimensões efetivas e hashes. Os [prompts](art/FIDELITY-PROMPTS.md) e [origens das gerações](art/fidelity-provenance.json) documentam o processo. Os PNG gerados foram copiados sem edição; máscaras e composição são aplicadas no renderizador.

`npm run assets:extract` reextrai as referências a partir dos recursos decodificados no projeto original vizinho. `npm run assets:manifest` atualiza somente os metadados da arte selecionada. Ambos requerem Python e Pillow; não são necessários para executar a cena.

A versão anterior com membros articulados está preservada no histórico/tag `v0.1.0-pilot`. Seus arquivos `pilot.js` e `assets/pilot/` não são carregados pela página atual. Esta cena se limita à caminhada: ainda não restaura pesca, catálogo completo, capítulos, calendário, áudio ou história. A ampliação completa continua no [plano](PLANO-REMASTERIZACAO.md).

Johnny Castaway e os recursos originais são conteúdo Sierra/Dynamix. Os detalhes recriados são interpretações de acabamento, não recuperação comprovada de informação perdida. Nenhuma outra reimplementação foi consultada.
