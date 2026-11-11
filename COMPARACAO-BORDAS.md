# Comparação de bordas A/B/C

Revisão de 11/11/2026, aplicada somente ao piloto HD.

## Resultado escolhido

A opção C, tolerância maior, é o padrão da cena. A opção A conserva o recorte anterior para revisão; B usa limites menores. As imagens PNG não foram modificadas nem regeneradas nesta revisão.

A comparação inicial mostrou que B ainda cortava detalhes do rosto. C começou com 1 pixel original no personagem e passou por 1,5 até 2 pixels na revisão das diagonais. Os valores são limites máximos: o desenho não é inflado até preenchê-los.

| Opção | Ilha | Coqueiro | Johnny |
|---|---:|---:|---:|
| A | Máscara antiga | Máscara antiga | Máscara antiga |
| B | 1 px | 0,65 px | 0,5 px |
| C | 2 px | 1 px | 2 px |

Todos os valores são pixels da imagem original, não pixels da tela. Há redução para 0,25 pixel nos espaços protegidos entre membros/folhas e na faixa inferior do personagem, com exceção dos pixels cinzentos da sombra. A regra protege o contorno nessa região; não demonstra que cada ponto colorido da sola coincide exatamente com o original.

## Composição

O processamento ocorre uma vez, no carregamento. Uma distância euclidiana ao contorno limita o quanto a transparência gerada pode ultrapassar o original. A opacidade é reduzida progressivamente perto do limite e nos halos muito fracos. Ela nunca é elevada acima da opacidade da imagem gerada.

Não existe preenchimento com o original borrado nas opções B/C. Isso remove a segunda borda e a transformação de franjas em áreas opacas. A margem de recorte tem 4 pixels originais e é descontada ao desenhar, inclusive no espelhamento, preservando os mesmos pontos de origem e posições dos percursos.

O perfil de proteção de lacunas não é aplicado à ilha: confundia concavidades da margem com espaços entre membros e mantinha degraus desnecessários. A ilha continua sujeita ao limite geral de distância. O mar mantém seu tratamento anterior, pois não tem recorte transparente de silhueta.

## Comparações reproduzíveis

- `/?view=edges`: ilha isolada e oito quadros consecutivos do primeiro percurso, sincronizados nas três opções. O espaço visível na sombra da ilha é ocupado pelo tronco na cena completa.
- `/?view=edge-poses&t=0`: oito poses laterais, A/B/C em linhas.
- `/?view=edge-scenes`: três cenas completas sincronizadas.
- `/?edges=strict`, `/?edges=small`, `/?edges=large`: cada opção isolada.
- `?t=8.4`: passagem atrás do tronco.
- `?view=poses&edges=large&group=turn-c&t=0`: diagonais comparadas às fontes.

Os recortes de borda não mudam índices, poses, posições, espelhamentos, velocidade ou regra de profundidade. Esta revisão não cria quadros intermediários de animação.

## Verificação

Quatro testes novos verificam distância contra uma busca direta, ausência de aumento de opacidade, limite progressivo das margens e preservação dos pontos de origem com margem/espelhamento. A suíte completa tem 21 testes, incluindo os testes do estudo anterior. Os hashes dos PNG selecionados continuam os mesmos.

A inspeção visual comparou as oito poses, a ilha, diagonais e a passagem atrás do coqueiro. A escolha de C é uma avaliação visual do piloto, não aprovação definitiva de todo o acervo. Continuam existindo diferenças de desenho interno entre folhas; a tolerância de contorno não corrige identidade, anatomia ou detalhes internos gerados.

Os diagnósticos de bordas estão em `window.castawayFidelity.status.edgeAudit`. A auditoria da máscara antiga fica explicitamente em `strictBaselineSilhouettes`, para não confundir o recorte antigo com o resultado atual. Capturas e gravação de revisão ficam em `artifacts/edges-*`, fora do Git.

Na cena padrão, a auditoria das 25 poses ativas registrou zero aumentos de opacidade e zero pixels além do limite dos espaços protegidos. O maior avanço observado além do contorno original foi 1,75 pixel na ilha, 0,971 no coqueiro e 1,979 no personagem, todos dentro dos respectivos limites. Isso mede a borda, não valida detalhes internos do desenho.

Em uma amostra local após aproximadamente 29 segundos, com área lógica 1280×720 e canvas 1600×900, a apresentação ficou em 60,0 fps, com P95 do desenho JS de 0,4 ms. Não houve erros ou avisos de página. A cadência das poses continua sendo a original; essa medição não representa 60 desenhos distintos por segundo nem teste em celular físico.
