# Uniformização das poses laterais 5–8

Registro histórico do estudo `v0.3.0-walk-study`, encerrado pelo usuário. A folha abaixo não é carregada pela cena atual, que conserva a seleção de arte e as bordas aprovadas anteriormente.

Ferramenta: gerador de imagens integrado, modo de edição, fundo transparente. Sem CLI/API alternativa e sem edição posterior do PNG.

Alvo: `web/dist/assets/fidelity/restored-walk-b.png`.
Referência de identidade/acabamento: `web/dist/assets/fidelity/restored-walk-a.png`.
Saída: `exec-6b507f9f-a1d2-4d30-945f-a0639d0f0f98.png`, 1254×1254.
Selecionada somente para o estudo: `web/dist/assets/fidelity/restored-walk-b-v2.png`.

## Prompt integral

Use case: identity-preserve. Edit target IMAGE 1 is the transparent 2x2 sprite sheet of walking Johnny, poses 5,6,7,8. IMAGE 2 is the identity/style reference sheet of the SAME man, poses 1,2,3,4. Correct only the facial identity, beard rendering, and garment surface finish in IMAGE 1 to match IMAGE 2. Make him the same man as IMAGE 2: round eye in same position and direction, subtle simple cheek, compact soft dark shaggy beard and small closed ochre mouth (not round open lips), olive ragged shirt and offwhite ragged shorts with the same gentle shading. Preserve IMAGE 1's entire sheet geometry pixel-for-pixel in normalized coordinates: four characters positions, sizes, silhouettes, head/cap outline, nose outline, belly outline, shoulder, arm, hands, hips, knees, shins, ankles, every toe, ground shadow, and transparent gaps between legs MUST STAY EXACTLY WHERE THEY ARE. Do NOT change pose, proportions, body fullness, expression, facing, silhouette or camera; do not recenter, zoom or rescale. Confine edits inside existing face/beard/clothing. Keep the 2x2 layout and margins exactly the same. No additional poses, labels, objects, outlines or background. Genuine transparent background. The output is IMAGE 1 only, not a combined sheet. This is color/detail harmonization of animation keyframes, not a redesign.

## Seleção

O rosto e a borda da camiseta ficaram mais próximos da primeira folha. A seleção conserva a versão anterior para comparação e usa o tratamento C no navegador. O pedido de preservação é uma restrição do prompt, não uma garantia de identidade pixel a pixel do resultado gerado. Os intermediários são produzidos pelo renderizador do estudo, não por esta geração.
