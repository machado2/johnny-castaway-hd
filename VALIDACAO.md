# Validação do piloto HD revisado

Data: 10/11/2026. Windows, navegador interno baseado em Chromium. A revisão substitui as poses inteiras da primeira tentativa por articulações contínuas, recompõe a ilha e usa um oceano pintado.

## Fluidez observada

| Área de apresentação | Densidade solicitada | Média observada | P95 do intervalo entre apresentações | P95 do trabalho JS de desenho |
|---|---:|---:|---:|---:|
| 1920×1080 | 1 | 60,0 fps | 17,0 ms | 1,0 ms |
| 2560×1080 | 1 | 60,0 fps | 16,8 ms | 0,8 ms |
| 390×844, celular simulado | 3, limitada a 2 | 60,0 fps | 16,8 ms | 0,9 ms |

Estatísticas dos últimos 300 quadros, cerca de cinco segundos, coletadas após 34, 33 e 23 segundos de execução respectivamente. O tempo JS de desenho não mede isoladamente todo o custo de GPU/composição. São medições locais curtas, sem garantia de 60 fps em todo aparelho. A velocidade da cena é baseada no tempo e a passada na distância, independentemente da frequência da tela.

## Verificações

- Dez testes automatizados aprovados: pé de apoio estacionário nos dois sentidos, alternância sem saltos no ciclo, comprimento das pernas, identificação da faixa de areia, enquadramento, continuidade do percurso, relógios de 30 a 144 Hz, sons sem repetição, integridade das imagens e isolamento da progressão original.
- A matriz de enquadramento vai de 320×568 a 5120×1440 e inclui 4K, retrato, paisagem e densidades fracionárias. São testes de geometria, não medições de desempenho em cada resolução.
- Capturas inspecionadas em Full HD, ultrawide e retrato: caminhada com um pé de apoio e outro em balanço, pesca e passagem atrás do coqueiro.
- Apoio calculado a partir do contorno opaco da areia, em vez de uma linha horizontal que atravessava a água.
- O personagem mantém o mesmo tronco, mãos e pés entre caminhada e pesca. A água recebe deslocamento suave e pequenas cristas junto à margem.
- Nenhum erro de página registrado durante os cenários exercitados.
- Na integração anterior, também foram verificados desbloqueio de áudio por clique, pausa/retomada ao ocultar a página e armazenamento local vazio. Esse código foi mantido nesta revisão; as medições da tabela são da arte e do movimento novos.

Os relatórios `revised-performance-*.json` e as capturas `revised-*.png` ficam em `artifacts/`, fora do Git. Não foram validados telefones físicos, Safari/iOS, consumo de bateria nem sessões prolongadas. A sequência é um piloto autoral de 32 segundos, não a reprodução completa dos eventos originais.

## Isolamento e versões

O projeto original continua em `../johnycastaway`, com servidor na porta 4173 e publicação própria. Seus arquivos de execução, ferramentas, testes e AGENTS.md foram comparados com `pre-hd-pilot-2026-11-10` e não têm alterações. O plano foi transferido para este projeto; não houve publicação sobre o site original.

O HD tem repositório próprio, porta 4174, sem CNAME, configuração de Pages ou alterações de DNS. A tag `pilot-art-study-v1` preserva localmente o primeiro estudo de arte; `v0.1.0-pilot` identifica a revisão com nova caminhada, ilha e oceano.
