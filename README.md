# Johnny Castaway HD — cena piloto

Experiência visual independente da [reconstrução fiel ao original](https://github.com/machado2/johnny-castaway). Este repositório não publica nem altera o site original em castaway.fbmac.net.

O piloto apresenta uma cena de 32 segundos em repetição: Johnny caminha pela ilha, pesca, passa atrás do coqueiro e retorna. Ilha, coqueiro e personagens foram redesenhados a partir das imagens extraídas dos arquivos originais fornecidos. Céu, nuvens, mar, espuma e linha de pesca são desenhados e animados no canvas.

## Ver localmente

Requer Node.js. Nenhuma dependência npm é necessária para executar ou testar.

```text
npm start
```

Abra [http://127.0.0.1:4174](http://127.0.0.1:4174). A animação começa automaticamente; um clique no canvas libera os efeitos sonoros. O servidor escuta somente em 127.0.0.1. As imagens e os sons são locais, sem chamadas externas durante a reprodução.

Apenas o canvas é visível. O enquadramento se adapta a ultrawide, Full HD, tablet e celular sem distorcer os desenhos. Alterar o tamanho da janela ou a densidade da tela não muda a velocidade da animação. Ao ocultar a página, a animação pausa.

## O que o piloto implementa

- Arte nova com transparência: ilha, coqueiro, 16 poses de caminhada e oito poses de pesca.
- Apresentação sincronizada com a tela, aproximadamente 60 fps nos testes locais; posições, mar, nuvens e balanço do coqueiro são atualizados a cada apresentação.
- As poses desenhadas são discretas: não há 60 desenhos inéditos por segundo nem interpolação artificial por dissolução.
- Escala uniforme, limites de densidade e de resolução interna para controlar o custo de desenho; a geometria permanece independente da densidade de pixels.
- Camadas de profundidade, ancoragem dos pés e linha presa à ponta da vara em cada pose.
- Dois efeitos extraídos do original, também referenciados por MJFISH.TTM, reutilizados em pontos próprios deste piloto. O sincronismo é demonstrativo.
- Nenhuma leitura ou escrita da progressão salva do projeto original.

Este é um estudo de arte e movimento, com uma sequência própria. Ainda não executa o catálogo completo TTM/ADS, os capítulos, o calendário ou a história original. O renderizador do piloto usa Canvas 2D. A produção completa da arte, a integração da história e a avaliação de WebGL permanecem no [plano de remasterização](PLANO-REMASTERIZACAO.md).

## Validação

```text
npm test
```

Os testes cobrem enquadramento, continuidade dos caminhos, frequência de apresentação, eventos sonoros sem duplicação, associação das imagens com seus hashes e isolamento da progressão original.

Verificações de navegador e limites da medição estão em [VALIDACAO.md](VALIDACAO.md). A visualização de celular foi simulada no desktop, não testada em telefone físico. Safari/iOS ainda não foi validado.

Para examinar um instante sem avançar a animação, use [/?t=10](http://127.0.0.1:4174/?t=10). O parâmetro serve para revisão e testes; a página sem parâmetro é animada. Diagnósticos somente de leitura ficam em `window.castawayPilot.status`.

## Arte e origem

Os arquivos finais estão em `web/dist/assets/pilot/`. Os [prompts de geração e correção](art/PROMPTS.md) e a [proveniência](art/provenance.json) registram as referências e os arquivos selecionados. A arte foi produzida com a ferramenta integrada de geração de imagens e revisada em composição. A transparência das poses de pesca passou por uma correção adicional.

`python tools/pilot_manifest.py` regenera apenas as coordenadas e os metadados dos recortes, sem editar as imagens. Requer Pillow, como a extração do projeto original.

Johnny Castaway e os efeitos originais são conteúdo do software Sierra/Dynamix. A arte recriada é uma interpretação visual para este piloto; não é apresentada como arte original recuperada. Nenhuma outra reimplementação foi consultada.
