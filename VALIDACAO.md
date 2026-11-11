# Validação da restauração piloto

Atualização de bordas: a composição padrão passou a preservar a transparência gerada dentro de uma faixa de tolerância. A comparação A/B/C, escolha do perfil e verificações estão em [COMPARACAO-BORDAS.md](COMPARACAO-BORDAS.md). As medições e a auditoria de máscara abaixo registram a versão anterior, v0.2.0, e não devem ser confundidas com o tratamento de bordas atual.

Data: 11/11/2026. Windows, navegador interno baseado em Chromium. Esta revisão substitui a caminhada articulada por poses e percursos extraídos do original, e refaz o acabamento de todos os elementos da cena de caminhada.

## Compatibilidade e revisão visual

- Sete testes novos aprovados: seis percursos completos, viradas, regra de profundidade, todas as poses usadas com arte correspondente, hashes, frequência de apresentação independente da lógica e enquadramento. A suíte completa tem 17 testes; os dez antigos dizem respeito ao piloto anterior.
- A cena usa 25 poses distintas entre as 28 restauradas. Índices, coordenadas e espelhamentos das seis rotas são comparados integralmente com as tabelas extraídas.
- Ilha, coqueiro e 25 poses ativas: nenhuma expansão de opacidade além da faixa de um pixel original ao redor da silhueta e nenhuma perda no interior fora dessa faixa. A máscara final também coincide com a máscara suavizada usada pelo renderizador.
- Essa verificação demonstra a restrição de contorno, não a qualidade anatômica ou a identidade de cada detalhe. A revisão ampliada encontrou uma tentativa deslocada de walk-b e duas poses invertidas em turn-c. Esses resultados foram rejeitados; as folhas selecionadas foram corrigidas e reinspecionadas.
- Foram comparadas as oito poses laterais e as cinco folhas de virada, além da composição completa sincronizada. Ainda há variações de desenho interno entre folhas, especialmente no rosto; o piloto serve para avaliar esse acabamento, não é aprovação artística definitiva de todo o catálogo.
- A passagem atrás do coqueiro foi conferida no instante 8,4 s; o limite de profundidade reproduz a linha original em y=293. As coordenadas dos percursos não foram adaptadas a uma ilha redesenhada.
- O mar mantém as grandes regiões de cor do original e recebe textura da geração. Sua ondulação é demonstrativa; a sequência completa da água ainda não foi restaurada.
- A extensão do céu no retrato foi corrigida após a captura revelar uma emenda de cor. A captura final usa a cor da própria primeira linha do fundo.

## Apresentação observada

| Área | Densidade solicitada | Média | P95 do intervalo | P95 do desenho JS |
|---|---:|---:|---:|---:|
| 1920×1080 | 1 | 60,0 fps | 16,9 ms | 0,5 ms |
| 2560×1080 | 1 | 60,0 fps | 16,9 ms | 0,6 ms |
| 390×844, celular simulado | 3, limitada a 2 | 60,0 fps | 16,9 ms | 0,6 ms |

Amostras dos últimos 300 intervalos após aproximadamente 29, 39 e 41 segundos de execução. O ajuste posterior do céu foi revisto visualmente e não teve nova medição de desempenho. O tempo JS não mede todo o trabalho de GPU/composição. Nenhum erro ou aviso de página foi registrado nos cenários medidos.

Esses números são a frequência de apresentação do canvas. **As poses e os deslocamentos ainda seguem a cadência original**, sem 60 desenhos novos por segundo, interpolação ou dissolução. A próxima etapa de fluidez precisa criar intermediários mantendo apoio dos pés e ordem dos membros.

A matriz automatizada vai de 320×568 a 5120×1440 e inclui 4K, retrato, paisagem e densidades fracionárias. As três áreas da tabela também foram inspecionadas visualmente. Não foram testados telefone físico, Safari/iOS, bateria ou sessões prolongadas.

## Arquivos e isolamento

Relatórios `fidelity-*.json` e capturas `fidelity-*.png` estão em `artifacts/`, fora do Git. A comparação animada é acessível em `/?view=compare`; o instante `?view=compare&t=1.4` reproduz a captura final.

Toda a implementação desta revisão está em johnny-castaway-hd, com servidor local na porta 4174. O checkout original estava limpo na verificação final; esta revisão não escreveu nele nem publicou sobre seu site, domínio ou DNS. O HD não tem CNAME nem configuração de publicação Pages.

A tag `v0.1.0-pilot` preserva o estudo anterior com membros articulados. `v0.2.0-fidelity-pilot` identifica esta restauração de caminhada. A seleção demonstrativa dura aproximadamente 20 segundos e não executa pesca, áudio, capítulos ou a história completa.
