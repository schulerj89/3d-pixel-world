# House wall texture provenance

These two wall textures are derived from Poly Haven assets and are distributed
under CC0 1.0 Universal. Attribution is not required, but source details are
retained here for traceability.

| Local file | Source asset | Creator | Original downloaded file | Processing |
| --- | --- | --- | --- | --- |
| `interior-painted-plaster.webp` | [Painted Plaster Wall](https://polyhaven.com/a/painted_plaster_wall) | Amal Kumar | [`painted_plaster_wall_diff_1k.jpg`](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_plaster_wall/painted_plaster_wall_diff_1k.jpg) | Diffuse map resized from 1024×1024 to 512×512 and encoded as WebP quality 76. |
| `exterior-wall-cladding.webp` | [Exterior Wall Cladding](https://polyhaven.com/a/exterior_wall_cladding) | Charlotte Baglioni | [`exterior_wall_cladding_diff_1k.jpg`](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/exterior_wall_cladding/exterior_wall_cladding_diff_1k.jpg) | Diffuse map resized from 1024×1024 to 512×512 and encoded as WebP quality 76. |

Poly Haven's [asset license](https://polyhaven.com/license) states that all of
its textures are CC0 and may be used, modified, and redistributed, including in
commercial work, without attribution. The CC0 summary and legal code are at
<https://creativecommons.org/publicdomain/zero/1.0/>.

Only the diffuse maps are shipped. The runtime uses a rough, non-metallic
material and a solid-color fallback so the house remains readable if a texture
cannot load.
