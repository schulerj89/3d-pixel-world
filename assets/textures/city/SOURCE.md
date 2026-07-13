# Patterned Paving sidewalk texture

- Asset: Patterned Paving, diffuse 1K JPG
- Creator: Charlotte Baglioni / Poly Haven
- Source: https://polyhaven.com/a/patterned_paving
- Download: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/patterned_paving/patterned_paving_diff_1k.jpg
- License: CC0 1.0 / public domain
- License details: https://polyhaven.com/license

Only the 1024x1024 diffuse map is included. The runtime reuses it across one
merged sidewalk mesh, adding one decoded texture and one textured draw call to
the City world.

# Partly cloudy City sky

- Asset: Kloofendal 48d Partly Cloudy (Pure Sky), tonemapped JPG derivative
- Creators: Greg Zaal (original) and Jarod Guest (pure-sky edit) / Poly Haven
- Source: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
- Original download: https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/kloofendal_48d_partly_cloudy_puresky.jpg
- License: CC0 1.0 / public domain
- License details: https://polyhaven.com/license

The included 1024x512 JPG was resized from Poly Haven's tonemapped panorama
at JPEG quality 90. It is used only by the City world's inward-facing sky dome,
adding one 60 KB texture and one draw call without an HDR decoder dependency.
