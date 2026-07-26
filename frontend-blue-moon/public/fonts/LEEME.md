# Fuentes de marca (Blue Moon)

Colocá acá los archivos de las fuentes licenciadas que provee la diseñadora.
Los `@font-face` ya están declarados en `src/styles/global.css` esperando estos
nombres exactos. Formato ideal: **.woff2** (más liviano). Si además tenés `.woff`, mejor.

Nombres esperados:

- Houschka (texto):
  - `houschka-regular.woff2`  (+ opcional `houschka-regular.woff`)
  - `houschka-medium.woff2`   (+ opcional `houschka-medium.woff`)   ← pesos 500/600
- Bochan (títulos):
  - `bochan.woff2`            (+ opcional `bochan.woff`)
- Adelia (ornamental, sólo acentos):
  - `adelia.woff2`            (+ opcional `adelia.woff`)

Si sólo tenés `.otf`/`.ttf`, dejalos igual acá y avisá: se puede convertir a woff2
o ajustar el `src` de los @font-face para apuntar a esos formatos.

Mientras no estén estos archivos, la web usa los fallbacks (Cormorant Garamond y
Quicksand) y no se rompe nada.
