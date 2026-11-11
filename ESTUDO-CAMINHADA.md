# Correção da caminhada lateral

Revisão de 11/11/2026, isolada da cena HD principal e do projeto original publicado.

- [Comparação em movimento](http://127.0.0.1:4174/walk-study.html): original extraído à esquerda, nova caminhada à direita.
- [Câmera lenta, ¼ da velocidade](http://127.0.0.1:4174/walk-study.html?speed=slow).
- [Oito fases do ciclo](http://127.0.0.1:4174/walk-study.html?view=phases&t=0).
- `?t=1.55` congela um instante; `?debug=1` mostra articulações e contatos.

## Problema corrigido

O estudo v0.3.0 foi rejeitado pelo usuário. A câmera avançava enquanto alguns quadros ficavam parados; havia uma transição sem intermediários e troca de pintura no meio dos demais intervalos. A correspondência dos membros também não conservava a identidade física de cada perna durante o cruzamento. A soma produzia saltos e deslizamento. Esse método foi removido da implementação atual e permanece no histórico da tag.

A comparação agora usa câmera e chão fixos. Cada personagem atravessa a área visível e só reinicia fora dela. Em retrato os painéis ficam empilhados. A coluna A contém os pixels extraídos, com sua cadência, em vez de outra versão HD.

## Movimento contínuo

O trecho lateral usa os nove primeiros registros da rota 3 de SCRANTIC: 4, 5, 6, 7, 8, 1, 2, 3 e novamente 4. O ciclo mantém 0,825 segundo e avanço de 57 pixels originais. Os instantes das referências continuam desiguais, conforme o original.

Cabeça, quadril e braço seguem curvas contínuas orientadas por medidas dessas poses. A pintura do corpo acompanha o movimento; não fica congelada no espaço. Cada perna conserva sua identidade e ordem de sobreposição durante todo o ciclo.

O pé de apoio mantém posição e rotação no chão enquanto o corpo avança. Durante a recuperação ele sobe e avança por uma curva, com velocidade nula nos extremos. A sola é medida na pintura efetivamente carregada, para evitar afundamento. O joelho recebe uma correção de flexão para a frente; o tornozelo faz uma transição contínua entre panturrilha e pé, mantendo a superfície inferior do pé rígida.

Não há contagem fixa de intermediários, retenção de pose nem troca de textura no meio do passo. A posição é calculada pelo tempo de cada apresentação. A renderização usa WebGL nativo em uma superfície auxiliar, composta no único canvas visível, sem bibliotecas de outras reimplementações.

## Pintura e fidelidade

O gerador integrado editou a pose 1 da restauração para separar corpo, braço, perna próxima e perna distante. O arquivo gerado foi copiado integralmente para `web/dist/assets/fidelity/walk-layers-v1.png`. O renderizador limpa transparências fracas e registra cada parte sobre a referência C aprovada antes de animá-la.

O [prompt integral](art/WALK-CONTINUOUS-PROMPT.md) e o manifesto `web/dist/assets/fidelity/walk-study.json` registram origem e hashes. `art/walk-contact-reference.json` guarda as guias e a geometria das solas medidas no navegador para os testes.

Esta é uma reconstrução contínua guiada pelos originais, **não uma ampliação geometricamente idêntica de cada quadro**. Apoios e joelhos são corrigidos; silhuetas intermediárias mudam. A faixa C continua sendo uma garantia dos recortes estáticos da cena principal, não um limite comprovado para cada intermediário desta página.

## Verificação e limites

Seis testes específicos verificam contato estável enquanto o torso avança, sola no chão/levantada, continuidade nas trocas de fase, avanço do corpo e identidade das pernas, rigidez da pintura dos pés e integridade das referências. A suíte completa tem 27 testes; dez são legados do primeiro piloto e não comprovam qualidade artística desta revisão.

As oito fases e as junções foram inspecionadas visualmente, com enquadramento em Full HD, ultrawide e 390×844. O tamanho de celular foi simulado; não houve teste em aparelho físico. Os diagnósticos não apontaram erros de execução. Capturas locais ficam em `artifacts/`.

A gravação de movimento nesta sessão apresentou baixa frequência de quadros. O controle visual do Chrome foi interrompido pela ferramenta antes de concluir a avaliação em primeiro plano. Portanto, não se declara uma medição final de 60 fps nem aprovação visual de fluidez. A inspeção de poses e os testes geométricos não substituem essa avaliação.

O resultado abrange somente este ciclo lateral. A cena da ilha, viradas, paradas, demais ações e o domínio publicado não foram alterados. A incorporação do movimento à cena completa depende da avaliação desta prévia. Diagnóstico de leitura: `window.castawayWalkStudy.status`.
