# Estudo da caminhada lateral

Experimento de 11/11/2026 para revisão visual, separado da cena HD principal e do projeto original publicado.

## Ver o resultado

- [Comparação animada](http://127.0.0.1:4174/walk-study.html): A é a caminhada HD atual; B combina o ajuste de aparência com o teste de intermediários.
- [Velocidade reduzida a 1/4](http://127.0.0.1:4174/walk-study.html?speed=slow).
- [Oito poses, antes e depois](http://127.0.0.1:4174/walk-study.html?view=poses&t=0).
- [Intermediários 1→2 e 2→3](http://127.0.0.1:4174/walk-study.html?view=intermediates&first=1&t=0). Trocar `first` por 3, 5 ou 7 mostra os demais pares. O par 3→4 mostra a retenção do quadro original, não novos desenhos.

A câmera acompanha o mesmo percurso nos dois painéis. As linhas do chão mostram o deslocamento relativo dos pés. O ciclo termina na repetição da pose inicial e a grade se repete a cada terço do deslocamento do ciclo, evitando um salto de câmera na volta. Em retrato os painéis ficam empilhados.

## Arte

O gerador integrado editou a folha das poses 5–8 para aproximar rosto, barba e roupa das poses 1–4, pedindo a conservação de todos os contornos e posições. O PNG foi copiado sem retoque para `web/dist/assets/fidelity/restored-walk-b-v2.png`; a versão anterior continua disponível.

Os oito quadros de referência passam pelo mesmo tratamento C de bordas já aprovado. O pedido ao gerador não constitui bloqueio geométrico: a máscara limita o contorno, mas detalhes internos ainda podem variar. A melhoria de uniformidade deve ser avaliada na folha e em movimento.

O [prompt integral](art/WALK-STUDY-PROMPT.md) registra a edição. `web/dist/assets/fidelity/walk-study.json` contém a origem e os hashes da nova folha e das referências.

## Movimento

O trecho usa os primeiros nove registros da rota 3 extraída de SCRANTIC: poses 4, 5, 6, 7, 8, 1, 2, 3 e novamente 4. Seus instantes e posições permanecem intactos; o ciclo tem 0,825 segundo e percorre 57 pixels originais. Os intervalos de 55 e 110 ms não são substituídos por durações uniformes.

Pontos medidos nas imagens orientam uma deformação do desenho completo entre poses vizinhas. Não se usa o torso fixo nem a passada articulada do primeiro piloto. Em cada intervalo aceito são preparados sete quadros adicionais; a translação do personagem usa a mesma fração temporal da deformação.

Cada intermediário contém **um único desenho deformado**, escolhido do quadro vizinho mais próximo. Misturar os dois desenhos, mesmo após alinhamento, gerava contornos duplos em mãos e joelhos e foi descartado. A rasterização usa coordenadas dos centros dos pixels e transparência pré-multiplicada para evitar costuras claras entre triângulos.

São 49 intermediários em sete transições, além das oito poses de referência. Na transição **3→4**, o cruzamento das pernas não admite a correspondência usada sem inverter triângulos; o teste mantém a pose e a posição originais até o próximo quadro. A interpolação não passa por paradas, viradas ou outros percursos: estes sequer fazem parte desta página.

## Limites observados

- A troca entre os dois desenhos de referência no meio dos intervalos ainda pode produzir uma pequena mudança de contorno. O teste não é uma caminhada final inteiramente contínua.
- A ausência de triângulos invertidos não prova correção anatômica. A correspondência de contornos nas oclusões não preserva, por si só, a identidade de cada perna escondida.
- Os instantes e posições originais são preservados; os pontos internos são medições aproximadas. Não se declara contato dos pés absolutamente travado em todo intermediário.
- A tolerância C se aplica aos quadros de referência. A silhueta intermediária é transportada pela deformação; não existe uma silhueta original correspondente a esses novos instantes para comprovar igualdade.
- Ter 49 quadros adicionais e apresentar perto de 60 Hz não significa 60 desenhos novos por segundo nem aprovação visual do movimento. Na transição retida há repetição de pose.
- O novo acabamento e o novo movimento estão somente neste comparativo. `index.html`, `fidelity.js`, as imagens do cenário e o manifesto ativo da cena principal não foram alterados.

O passo seguinte para fechar o ciclo é desenhar intermediários específicos para a oclusão 3→4 e reduzir as mudanças de contorno na troca de referência. Antes de expandir a técnica para viradas ou outras ações, é necessário avaliar este comparativo.

## Verificação

`npm test`: 25 testes aprovados, sendo quatro novos para preservação dos registros originais, rejeição de dobras, rasterização sem costuras/franjas e integridade da arte. Dez desses 25 testes são legados do piloto articulado e não demonstram qualidade da caminhada atual.

Inspeção no navegador em 1920×1080, 3440×1440 e 390×844, com escala uniforme e ambos os personagens inteiros. As dimensões de celular foram simuladas; não houve teste de desempenho em aparelho físico. Quadros das oito transições foram inspecionados, incluindo a retenção 3→4. Nenhum erro de execução foi observado.

Em 1920×1080, depois da preparação dos intermediários, a amostra observada foi de 59,98 apresentações por segundo e 0,4 ms no percentil 95 do tempo de desenho. Isso mede a execução desta prévia nesta máquina, não garante desempenho em outros aparelhos nem substitui a avaliação da passada.

Diagnósticos de leitura: `window.castawayWalkStudy.status`. Capturas e gravação local ficam em `artifacts/`, ignorado pelo Git.
