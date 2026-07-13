# Quaternius Ultimate Animated Animal Pack

- Creator: Quaternius
- Pack page: https://quaternius.com/packs/ultimateanimatedanimals.html
- Author download folder: https://drive.google.com/drive/folders/1uJ3N5HfB7jKTseJUNQr3N4YaN0UuEtHk
- License: CC0 1.0 Universal (Public Domain Dedication)
- License deed: https://creativecommons.org/publicdomain/zero/1.0/

The creator's original pack page identifies all 12 animated animal models as
CC0 and free for personal and commercial use. The author-supplied download
folder also includes `License.txt` identifying the pack as CC0 1.0 Universal.
Attribution is not required, but this provenance is retained with the assets.

Runtime extracts:

- `deer.obj` / `deer.mtl`
- `fox.obj` / `fox.mtl`
- `wolf.obj` / `wolf.mtl`

The OBJ files are the pack's static standing poses. Runtime code folds the
authored material colors into one vertex-colored material per species, so each
visible animal costs one draw call and uses no textures. Models load only when
the player approaches an animal landmark; primitive fallbacks remain available
if loading fails. The complete pack's animated source files remain available
from the creator's folder but are intentionally not shipped for this scene.
