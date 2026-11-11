# Prompts da pesca

Modo: gerador integrado de imagens, edição com fundo transparente. PNG selecionados copiados sem edição para `web/dist/assets/fishing/`; a composição e as máscaras são aplicadas pelo renderizador.

Todas as folhas de Johnny usam [FISHING-PROMPT.txt](FISHING-PROMPT.txt) como prompt base. Entrada 1: `art/references/fishing/fish-NN-target.png`, alvo de edição. Entrada 2: `web/dist/assets/fidelity/restored-walk-a.png`, referência de identidade e acabamento apenas. Folhas 00–03 usam somente o prompt base.

Folhas 04–06 acrescentam exatamente:

```text
The canvas aspect ratio must remain 1408:1632 (about 0.863), NOT a tall 2:3 portrait. Keep all fishing rods thin, including all bent shapes and cast lines, exactly matching the source.
```

Folhas 07–09 acrescentam:

```text
Keep output canvas aspect ratio exactly 1408:1632. Keep the green fish in its exact pose, location and size; restore it with smooth lime-green scales, orange-red tail and fins, same original expression. Every fishing rod, line and fish must remain in its exact source silhouette.
```

Folhas 10–13 acrescentam:

```text
Keep output aspect ratio 1408:1632. Preserve all back-facing poses: where the source shows the back of Johnny's head, keep the back of his head, never add a face or turn it. Preserve the lime-green fish and orange-red fins in their exact source positions and shapes.
```

Na folha 13, o texto base substitui `SIX` por `FOUR`, `all six` por `all four` e `six existing` por `four existing`. Acrescenta ainda:

```text
Only the first TWO rows are occupied by FOUR poses; the bottom third of the canvas must stay completely empty and transparent.
```

Prompt integral da ondulação, entrada `art/references/fishing/water-target.png`:

```text
Use case: precise-object-edit. Edit this transparent 800x960 sheet containing exactly three tiny water-ripple sprites in ONE column and THREE rows. Restore these original Johnny Castaway water ripple drawings like a faithful anti-aliasing/color filter. Smooth the existing pale-gray pixel strokes into thin silvery-white curved strokes with subtle pale-blue highlights, within 1 original pixel (10 input pixels) of the original shape. Preserve every ring segment, gap, overall elliptical silhouette, size, position and transparent margins. Each 800x320 cell must retain its drawing at precisely the original coordinates. No water background, no blue disks, no new rings, no drops, no shadows, no text, no added objects. True transparent background. Keep the exact 800:960 aspect ratio and original stroke positions.
```

As dimensões efetivamente retornadas e os recortes de registro de cada desenho completo estão em `web/dist/assets/fishing/restored.json`. As proporções de saída variaram entre folhas, por isso o registro não presume a resolução solicitada. Não há ajuste independente de cabeça, braços, pernas ou objetos.
