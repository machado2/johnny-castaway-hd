# Caminhada HD fiel aos quadros originais

Revisão de direção em 11/11/2026, após a avaliação do piloto pelo usuário. O experimento de restauração foi implementado depois desta análise: poses e percursos extraídos, edição conservadora, transparência guiada pela silhueta original e comparação sincronizada. O estado e os limites estão no README e em VALIDACAO.md. Os intermediários de animação continuam sendo uma etapa posterior.

## Diagnóstico

O piloto passou a usar um torso fixo, membros articulados e um percurso autoral. O contato dos pés com o solo foi melhorado, mas isso não reproduz as poses, deformações expressivas, balanço do corpo e viradas do original. Medir 60 fps ou testar o comprimento das pernas não demonstra qualidade artística da caminhada.

A folha JOHNWALK.BMP extraída contém 36 imagens, incluindo diferentes direções e viradas. Não é um ciclo único em ordem numérica. O projeto original já usa tabelas com índice da imagem, posição x/y, espelhamento e rotas, além de tempos próprios. Essas informações devem conduzir a animação HD.

Direção proposta: melhorar o acabamento dos quadros existentes, preservando a posição de cada membro e objeto. Tratar cada original como imagem a editar, não apenas referência livre para desenhar outra pose.

## Estratégias a comparar

| Estratégia | Vantagem para este projeto | Limitação |
|---|---|---|
| Ampliação não generativa com acabamento de bordas e paleta uniforme | Referência de máxima estabilidade: mantém a estrutura e não inventa anatomia | Pode continuar com aspecto de pixel art ampliada; não recupera detalhes inexistentes |
| Edição conservadora de cada quadro pelo gerador de imagens | Permite contornos, cores e sombras mais bem resolvidos usando o original como alvo | O pedido em texto não garante coordenadas exatas; rosto, roupa, dedos e proporções podem variar entre quadros |
| Restauração guiada por contornos, silhuetas e pontos de referência | Dá controle estrutural adicional à edição generativa | Exige uma ferramenta que exponha esses controles; o gerador integrado atual não oferece um bloqueio geométrico verificável. Não prometer fidelidade absoluta |
| Ampliação da sequência considerando quadros vizinhos | Usa informação temporal, em vez de restaurar imagens isoladas | Precisa ser avaliada neste material pequeno e estilizado; métodos de vídeo não vêm automaticamente validados para sprites com transparência |
| Redesenho por traçado sobre os quadros originais | Controle direto de cada contorno, pose e sobreposição | Trabalho maior por quadro; útil para corrigir exceções onde a geração não preserve o desenho |

Uma pequena folha com vários quadros também pode ser testada na edição generativa para compartilhar aparência. Isso não garante consistência e pode deslocar os quadros ou misturar poses. Não enviar as 36 imagens pequenas de uma vez como única tentativa. Comparar com edição individual e a mesma referência de acabamento.

Referências gerais de técnica, sem uso de outras reimplementações do jogo:

- [ControlNet](https://arxiv.org/abs/2302.05543): condicionamento espacial por bordas, segmentação e pose.
- [BasicVSR](https://arxiv.org/abs/2012.02181): ampliação de vídeo com alinhamento e propagação de informação temporal.
- [RIFE](https://github.com/hzwer/ECCV2022-RIFE): interpolação de imagens entre instantes; candidato experimental para uma fase posterior, sem garantia de preservar pés cruzados ou objetos finos.

## Experimento recomendado

1. Escolher um trecho curto de caminhada lateral e reconstruí-lo com os índices, posições, espelhamentos e tempos das tabelas extraídas. Incluir apoio, cruzamento das pernas, chegada à parada e a transição de direção. Guardar os quadros e a sequência de referência.
2. Preparar uma ampliação conservadora como controle e uma versão de edição generativa dos mesmos quadros. A geração deve preservar pose, silhueta, escala relativa, expressão, roupa, objetos e transparência, alterando somente acabamento. Detalhes novos são interpretações, não recuperação comprovada de informação perdida.
3. Manter o sistema de coordenadas original. Ampliar as posições e margens pelo mesmo fator, sem recentralizar ou ajustar cada desenho automaticamente pelo seu recorte: isso apagaria o balanço original e criaria tremidas.
4. Comparar original ampliado e candidatos lado a lado, com o mesmo relógio, tamanho e percurso. Sobrepor os contornos para verificar deslocamentos de cabeça, quadril, joelhos, calcanhares, pontas dos pés e objetos. Avaliar também em reprodução lenta e velocidade normal.
5. Rejeitar quadros com mudança de pose, variação de identidade, membro trocado, alterações de volume ou transparência, ou que mudem de estilo entre imagens. Corrigir só os quadros que falharem; não avançar para o catálogo completo com um ciclo inconsistente.
6. Selecionar a abordagem pela fidelidade em movimento. Somente depois integrar a caminhada revisada à cena HD. O piloto atual fica como referência descartada de movimento, não como padrão a refinar indefinidamente.

## Mais fluidez: uma etapa separada

Primeiro preservar os quadros, durações e posições originais. Apresentar em 60 Hz não cria novas poses e não garante uma passada melhor.

Depois, testar intermediários entre poses consecutivas aprovadas, mantendo intactos os quadros originais e os instantes de contato. Avaliar interpolação automática e correção por traçado; não usar dissolução entre dois corpos. O pé de apoio, a ordem de sobreposição das pernas e os objetos segurados são restrições específicas da transição.

Deslocamento do corpo e mudança de pose precisam ser tratados juntos. Suavizar só a translação enquanto se segura um quadro pode fazer os pés deslizarem. Não interpolar por cima de cortes ou converter pausas intencionais em movimento contínuo.

## Cenário e formatos de tela

Aplicar o mesmo princípio de conservação à ilha, árvore e objetos: manter contornos e relações espaciais, melhorando o acabamento. O oceano animado também precisa ser revisto como sequência, não apenas como pintura estática bonita.

Preservar uma área central de ação com escala uniforme. Para ultrawide, estender principalmente mar e céu nas laterais; para retrato, ajustar o enquadramento e ampliar céu/mar conforme necessário. Não remodelar a ilha para preencher cada proporção. Todo experimento permanece no repositório HD, sem modificar o original publicado.
