# Quaternius Animated Alien Pack

- Creator: Quaternius
- Pack page: https://quaternius.com/packs/animatedalien.html
- Author download folder: https://drive.google.com/drive/folders/1ADdETHqjSIEUhjKjhLB9hQjeppXEqcvL
- License: CC0 1.0 Universal (Public Domain Dedication)
- License deed: https://creativecommons.org/publicdomain/zero/1.0/

The creator's pack page identifies the asset as CC0 and states that the cute
animated alien is free to use in personal and commercial projects. The
author-supplied `License.txt` in the download folder also identifies the pack
as CC0 1.0 Universal. Attribution is therefore not required, but the source is
recorded here for provenance.

Included runtime files:

- `quaternius-alien.obj` — the standing alien mesh from the pack's OBJ folder.
- `quaternius-alien.mtl` — original material color reference; retained for
  provenance. Runtime code folds these five material colors into one
  vertex-colored material to minimize draw calls.

No textures or animations are included in this runtime extraction. The game
loads the OBJ only while constructing the space world, retains its existing
primitive alien until loading succeeds, and disposes the resulting geometry
and material when that world is destroyed.
