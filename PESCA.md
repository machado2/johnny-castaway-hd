# Pesca completa em HD

Implementação de `FISHING.ADS`, sequência 2, usando o registro de cena 21 extraído do original. O roteiro escolhido termina com a captura de um peixe. A experiência permanece separada da reconstrução fiel e usa apenas o canvas.

## Arte e movimento

- 82 composições originais completas restauradas em 14 folhas, mais uma folha com as três ondulações da água. Os quadros de caminhada sem objetos reutilizam a restauração aprovada.
- As camadas que o próprio original usa para Johnny, vara e peixe foram compostas antes da restauração. Cada pose é exibida como um desenho inteiro, sem articulações, quadros intermediários, interpolação ou dissolução.
- As 352 apresentações de 55 ms e os quatro eventos de áudio vêm do roteiro original, com aleatoriedade fixada para a demonstração. A sequência dura 19,36 s. A pausa e a virada que a conectam ao início usam poses das tabelas originais da posição 4; o ciclo demonstrativo dura 22,11 s.
- A preparação registra o desenho completo na caixa original e conserva sua própria transparência. A silhueta pixelada não é aplicada como máscara às poses da pesca: esse recorte cortava partes opacas da cabeça e dos membros quando o contorno gerado não coincidia com o original. Somente franjas de alpha abaixo de 64/255 são atenuadas; a opacidade nunca aumenta. A passagem atrás do coqueiro continua aplicada na cena.
- A linha conserva os pontos extraídos. Seu acabamento HD simplifica a escada de pixels dentro de 0,65 pixel original, com sobreposição de 1,5 pixel na ponta da vara. Os tempos e o movimento permanecem originais.
- O enquadramento inclui toda a linha lançada, a ilha, o coqueiro e o peixe. A escala é uniforme; retrato mostra mais céu e mar.

## Arquivos e reprodução

Imagens selecionadas: `web/dist/assets/fishing/restored-00.png` até `restored-13.png` e `restored-water.png`. Produzidas pelo gerador integrado e copiadas sem edição. `restored.json` registra dimensões, recortes e hashes; `source.json` registra roteiro, posições, receitas de composição e origem dos arquivos. Os [prompts](art/FISHING-PROMPTS.md) e as referências em `art/references/fishing/` documentam a restauração. A identidade de Johnny usa a folha aprovada `assets/fidelity/restored-walk-a.png`.

Com o checkout original vizinho disponível:

```text
node tools/extract_fishing.mjs
python tools/fishing_references.py
python tools/verify_fishing.py
python tools/fishing_manifest.py
npm test
```

A verificação independente comparou as 352 apresentações compostas às operações originais e encontrou igualdade exata dos pixels de referência. Isso valida a extração e o posicionamento, não identidade perfeita de cada detalhe gerado.

## Revisão e limites

Testes cobrem o roteiro inteiro, eventos de áudio, repetição, integridade das imagens e enquadramento de 320×568 a 5120×1440, incluindo Full HD, 4K, retrato e paisagem. Revisão visual no Chrome: Full HD, ultrawide 3440×1440 e celular simulado 390×844. Não houve teste em telefone físico ou Safari.

A checagem anterior, limitada à tinta da vara, foi insuficiente: deixou passar cortes grandes no corpo. Ela foi substituída por `tools/check-fishing-poses.js`, executado no contexto do navegador sobre a saída real de `loadFishing`. A revisão atual verificou 2.433.605 pixels visíveis das 82 poses, com zero pixels cortados e zero aumentos de alpha. A imagem de referência e a saída usam o mesmo modo de rasterização Canvas, evitando diferenças de reamostragem entre CPU e GPU.

As 82 poses foram examinadas ampliadas em 14 folhas de revisão, cobrindo ida, lançamento, espera, captura e volta. Os PNG gerados, posições e tempos não foram alterados. A suíte local tem 37 testes. Esta revisão comprova a remoção dos cortes da composição; não certifica identidade artística perfeita. Permanecem detalhes da geração, como o carretel semelhante a dedos nas poses 24/25 e a ponta da linha separada na pose 50, que exigem revisão da arte, não outra máscara sobre o corpo.

Os sons originais são `4.wav`, `14.wav` e `9.wav`; o evento 16 corresponde ao recurso `14.wav`. Um toque/clique habilita o áudio. A cena pausa quando a página fica oculta.

Esta entrega demonstra a sequência escolhida. A história completa, calendário e demais cenas não são reproduzidos. Variações de acabamento entre poses continuam sujeitas à avaliação visual do usuário.
