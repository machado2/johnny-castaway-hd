# Validação do piloto HD

Data: 10/11/2026. Testes locais em Windows, Edge instalado, usando navegador automatizado sem janela. Medições curtas para verificar a viabilidade do piloto, sem equivaler a um teste prolongado em todos os aparelhos.

## Resultados

| Área de apresentação | Densidade solicitada | Média observada | P95 do intervalo entre apresentações | P95 do trabalho JS de desenho |
|---|---:|---:|---:|---:|
| 1920×1080 | 1 | 59,2 fps | 16,8 ms | 2,0 ms |
| 2560×1080 | 1 | 59,8 fps | 16,8 ms | 2,4 ms |
| 390×844, celular simulado | 3, limitada a 2 pelo piloto | 59,6 fps | 16,9 ms | 1,8 ms |

O tempo JS de desenho não mede isoladamente todo o custo de GPU/composição. As janelas de observação foram de aproximadamente 9, 7 e 5 segundos, respectivamente. A medição ocorreu durante a integração; a correção final da transparência da pesca foi verificada depois por imagens nas mesmas dimensões.

- Nenhuma exceção de página nos cenários exercitados.
- Áudio desbloqueado por clique e contexto de reprodução em execução.
- Pausa e retomada verificadas, sem avançar o tempo oculto. A mudança de visibilidade foi simulada no teste automatizado.
- Armazenamento local permaneceu vazio no contexto isolado; não houve alteração de progressão.
- Capturas revisadas em 1920×1080 (caminhada e pesca), 2560×1080 (passagem atrás do coqueiro) e 390×844 (pesca em retrato).
- Prévia animada aberta também no navegador interno para inspeção visual.
- Seis testes automatizados de lógica e integridade de recursos aprovados. Incluem vários tamanhos, de 320×568 a 5120×1440, densidades fracionárias e relógios de 30 a 144 Hz.

Os relatórios brutos e capturas locais ficam em `artifacts/`, fora do Git. Não foram validados dispositivos móveis físicos, Safari/iOS, consumo de bateria, sessões prolongadas, perda de contexto de GPU nem todos os eventos da história original.

## Isolamento

O projeto original continua em `../johnycastaway`, com servidor na porta 4173 e publicação própria. O HD usa porta 4174, arquivos e repositório independentes, sem CNAME, configuração de Pages ou alterações de DNS. Os arquivos de execução do original foram comparados com a tag anterior ao piloto e não têm alterações.
