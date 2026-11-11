# Caminhada: somente os quadros originais

Decisão do usuário em 11/11/2026: encerrar as tentativas de gerar quadros intermediários e de animar Johnny por partes separadas. A remasterização deve manter a quantidade de quadros, poses completas e cadência original, melhorando o acabamento de cada imagem existente.

A cena HD com as bordas aprovadas continua em [127.0.0.1:4174](http://127.0.0.1:4174/). O endereço antigo `walk-study.html` carrega a mesma cena, sem os experimentos. A comparação sincronizada permanece em [/?view=compare](http://127.0.0.1:4174/?view=compare).

O código e a pintura em partes do estudo v0.4.0 foram retirados da versão atual. Os experimentos rejeitados continuam recuperáveis no histórico Git:

- `v0.1.0-pilot`: caminhada articulada inicial.
- `v0.3.0-walk-study`: deformação entre poses e quadros intermediários.
- `v0.4.0-continuous-walk`: pintura dividida em corpo, braço e pernas.

Essas versões não são opções recomendadas nem etapas pendentes. Os prompts históricos registram o que foi tentado; não autorizam retomar essas técnicas.

A cena ativa usa cada pose inteira, com índices, posições, espelhamentos e tempos das tabelas extraídas. As seis rotas são verificadas integralmente contra essas referências. O piloto utiliza 25 poses originais entre 28 restauradas; ainda não cobre todo o catálogo. A revisão não alterou a arte aprovada da ilha, do coqueiro, do mar ou das poses completas, nem o projeto original publicado.

Verificação desta retirada: os 21 testes restantes passaram, sendo 11 da restauração atual e dez legados. O endereço antigo foi aberto no Chrome e confirmado com `fidelity.js`, bordas C e ausência do estudo em camadas; nenhum erro de página foi observado. A captura local está em `artifacts/original-frames-restored.png`.
