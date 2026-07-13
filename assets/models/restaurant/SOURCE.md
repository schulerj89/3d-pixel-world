# KayKit Restaurant Bits web kit

This directory contains a curated derivative of **KayKit: Restaurant Bits 1.0 FREE** by Kay Lousberg.

- Official source: https://kaylousberg.itch.io/restaurant-bits
- License: CC0 1.0 Universal; see `LICENSE-CC0.txt` and https://creativecommons.org/publicdomain/zero/1.0/
- Official itch.io upload: `Free`, upload ID `8784350`, dated 2023-09-29 08:32 UTC
- Downloaded archive size: 11,298,866 bytes
- Downloaded archive SHA-256: `75F75F0A1AE569F3F2348FA7A04CCD45D2F010D419045755C70AE43289B68E4B`
- Archive root/version: `KayKit_Restaurant_Bits_1.0_FREE`

`kaykit-restaurant-kit.glb` is a curated, optimized derivative containing 40 separately addressable glTF scenes. It is 628,692 bytes with SHA-256 `7616828FCFA0FD775AE53E6BCF0C677040B21BB56B6A3B55B6868B37F93C2C1E`. It contains 20,700 triangles, 23,370 uploaded vertices, 43 meshes/primitives, one material, and one 128x128 WebP gradient atlas. The atlas has an estimated 87,380-byte decoded GPU allocation including mip levels.

The two added blank variants were verified visually before runtime integration and rebuilt from the official Godot Asset Library repository at commit `153c8a7535b48237854cb54ff6890679f8c574d1`: `stove_multi` is the undecorated four-burner stove, and `kitchentable_A_large` is the undecorated prep table.

The dining-table food pass visually compared the pack's official `contents.png` and `sample.png` contact sheets before integration. The pack has no strawberry model; `food_ingredient_tomato` is its closest small red produce and is arranged in three-piece clusters on plain tables. `food_stew` was also added for meal variety. Both scenes reuse the existing shared atlas, adding no texture or material.

The cooking pass visually checked the official `contents.png` contact sheet before adding bun, uncooked burger patty, carrot, cheese, ham, potato, and steak ingredient scenes. They share the same material and atlas, so the seven interactive ingredients add 54,812 compressed bytes, 1,994 triangles, and no extra texture allocation.

The source pack's 1024x1024 atlas is explicitly designed by the creator to be downsampled to 128x128. The derivative uses `EXT_texture_webp` and `KHR_mesh_quantization`, both supported by the repository's bundled GLTFLoader. No Draco or Meshopt decoder is required.

The source GLTFs were merged as separate scenes, then optimized while preserving scene and node names:

```powershell
npx @gltf-transform/cli merge <selected source GLTFs...> restaurant-kit-raw.glb
npx @gltf-transform/cli optimize restaurant-kit-raw.glb kaykit-restaurant-kit.glb --compress quantize --flatten false --join false --palette false --texture-compress webp --texture-size 128
```

Available scene root names:

```text
wall
wall_window_open
wall_doorway
wall_orderwindow_decorated
door_A
table_round_A
chair_A
chair_stool
menu
floor_kitchen
fridge_A_decorated
oven
extractorhood
stove_multi_decorated
stove_multi
kitchencounter_sink_backsplash
kitchencounter_straight_A_backsplash
kitchencounter_innercorner_backsplash
kitchencabinet
kitchentable_A_large_decorated
kitchentable_A_large
dishrack_plates
shelf_papertowel_decorated
cuttingboard
knife
pan_A
pot_A
plate
bowl
food_burger
food_dinner
food_ingredient_tomato
food_stew
food_ingredient_carrot
food_ingredient_bun
food_ingredient_burger_uncooked
food_ingredient_steak
food_ingredient_potato
food_ingredient_ham
food_ingredient_cheese
```

Load this GLB once, index `gltf.scenes` by each scene's first/root node name, and clone the chosen scene. Repeated walls, floors, chairs, and tables should share geometry/material or use instancing. Gameplay collision should remain authored with simple boxes; do not derive collision from the visual mesh.
