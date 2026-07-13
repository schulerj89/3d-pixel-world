# Three.js Water texture provenance

`waternormals.jpg` is the normal map used by the official Three.js Water example, vendored from the Three.js `r160` tag to match this project's Three.js runtime.

- Water documentation: https://threejs.org/docs/pages/Water.html
- Texture source: https://github.com/mrdoob/three.js/blob/r160/examples/textures/waternormals.jpg
- Water source: https://github.com/mrdoob/three.js/blob/r160/examples/jsm/objects/Water.js
- License: MIT; preserved at `vendor/THREE-WATER-LICENSE.txt`.

`vendor/three-water-global.js` changes only the module wrapper so the official addon can use the repository's existing global Three.js instance. It also exposes an explicit render-target disposal method.
