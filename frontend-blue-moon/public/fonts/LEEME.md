# Fuentes de marca (Blue Moon)

Según el Manual de Marca. Colocá acá los archivos licenciados que provee la
diseñadora. Los `@font-face` ya están declarados en `src/styles/global.css`
esperando estos nombres exactos. Formato ideal: **.woff2** (+ `.woff` opcional).

Nombres esperados:

- **Houschka Rounded** — secundaria (cuerpo de texto):
  - `houschka-rounded-medium.woff2`         (+ opcional `.woff`)
  - `houschka-rounded-medium-italic.woff2`  (+ opcional `.woff`)
- **Bochan Serif** — primaria (titulares):
  - `bochan-serif.woff2`                    (+ opcional `.woff`)
- **Adelia** — primaria ornamental/script (acentos):
  - `adelia.woff2`                          (+ opcional `.woff`)

Si la diseñadora sólo tiene `.otf`/`.ttf`, dejalos igual acá con esos nombres
(ej. `bochan-serif.otf`) y avisá: se convierten a woff2 o se ajusta el `src`.

Mientras no estén, la web usa los fallbacks (Cormorant Garamond y Quicksand)
y no se rompe nada.
