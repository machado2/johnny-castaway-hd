# Pesca completa em HD

Implementação de `FISHING.ADS`, sequência 2, usando o registro de cena 21 extraído do original. O roteiro escolhido termina com a captura de um peixe. A experiência permanece separada da reconstrução fiel e usa apenas o canvas.

## Arte e movimento

- 82 composições originais completas restauradas em 14 folhas, mais uma folha com as três ondulações da água. Os quadros de caminhada sem objetos reutilizam a restauração aprovada.
- As camadas que o próprio original usa para Johnny, vara e peixe foram compostas antes da restauração. Cada pose é exibida como um desenho inteiro, sem articulações, quadros intermediários, interpolação ou dissolução.
- As 352 apresentações de 55 ms e os quatro eventos de áudio vêm do roteiro original, com aleatoriedade fixada para a demonstração. A sequência dura 19,36 s. A pausa e a virada que a conectam ao início usam poses das tabelas originais da posição 4; o ciclo demonstrativo dura 22,11 s.
- A preparação registra o desenho completo na caixa original. A máscara usa a tolerância de borda aprovada, sem elevar a opacidade gerada. A passagem atrás do coqueiro é aplicada na cena.
- A vara carregada usa uma guia de transparência derivada dos recursos originais 22/23 de `MJFISH1.BMP`. A guia inclui o espaço entre vara e linha e permite até 6 pixels originais de margem, evitando os cortes causados pela regra de espaços entre membros. A imagem continua inteira, sem camadas novas desenhadas ou alteração das poses.
- A linha conserva os pontos extraídos. Seu acabamento HD simplifica a escada de pixels dentro de 0,65 pixel original, com sobreposição de 1,5 pixel na ponta da vara. Os tempos e o movimento permanecem originais.
- O enquadramento inclui toda a linha lançada, a ilha, o coqueiro e o peixe. A escala é uniforme; retrato mostra mais céu e mar.

## Arquivos e reprodução

Imagens selecionadas: `web/dist/assets/fishing/restored-00.png` até `restored-13.png` e `restored-water.png`. Produzidas pelo gerador integrado e copiadas sem edição. `restored.json` registra dimensões, recortes e hashes; `source.json` registra roteiro, posições, receitas de composição e origem dos arquivos. Os [prompts](art/FISHING-PROMPTS.md) e as referências em `art/references/fishing/` documentam a restauração. A identidade de Johnny usa a folha aprovada `assets/fidelity/restored-walk-a.png`.

Com o checkout original vizinho disponível:

```text
node tools/extract_fishing.mjs
python tools/fishing_references.py
python tools/fishing_rod_guides.py
python tools/verify_fishing.py
python tools/fishing_manifest.py
npm test
```

A verificação independente comparou as 352 apresentações compostas às operações originais e encontrou igualdade exata dos pixels de referência. Isso valida a extração e o posicionamento, não identidade perfeita de cada detalhe gerado.

## Revisão e limites

Testes cobrem o roteiro inteiro, eventos de áudio, repetição, integridade das imagens e enquadramento de 320×568 a 5120×1440, incluindo Full HD, 4K, retrato e paisagem. Revisão visual no Chrome: Full HD, ultrawide 3440×1440 e celular simulado 390×844. Não houve teste em telefone físico ou Safari.

A correção da vara foi inspecionada nos 26 quadros da ida. `tools/check-fishing-rod.js`, executado no contexto do navegador, verifica a saída real de `loadFishing`: 7.335 colunas com tinta da vara, sem colunas apagadas pelo recorte. A suíte local tem 39 testes, incluindo posicionamento, espelhamento e limites das guias. Os PNG gerados, posições e tempos não foram alterados.

Os sons originais são `4.wav`, `14.wav` e `9.wav`; o evento 16 corresponde ao recurso `14.wav`. Um toque/clique habilita o áudio. A cena pausa quando a página fica oculta.

Esta entrega demonstra a sequência escolhida. A história completa, calendário e demais cenas não são reproduzidos. Variações de acabamento entre poses continuam sujeitas à avaliação visual do usuário.
