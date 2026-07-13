(function () {
  "use strict";

  // A self-contained structure kit for the 70x70 space destination. Collision
  // rectangles are returned in space-world coordinates, ready for player tests.
  window.spaceStructureFactory = function spaceStructureFactory(THREE) {
    const group = new THREE.Group();
    group.name = "space-structures";
    const resources = [];
    const geometry = value => (resources.push(value), value);
    const material = value => (resources.push(value), value);
    const box = geometry(new THREE.BoxGeometry(1, 1, 1));
    const cylinder = geometry(new THREE.CylinderGeometry(.5, .5, 1, 12));
    const sphere = geometry(new THREE.SphereGeometry(.5, 12, 8));
    const mats = {
      floor: material(new THREE.MeshStandardMaterial({ color: 0x303851, roughness: .82 })),
      wall: material(new THREE.MeshStandardMaterial({ color: 0xb9c9d7, metalness: .28, roughness: .58 })),
      trim: material(new THREE.MeshStandardMaterial({ color: 0x47576d, metalness: .5, roughness: .46 })),
      glass: material(new THREE.MeshStandardMaterial({ color: 0x69dcf0, emissive: 0x173d55, emissiveIntensity: .7, roughness: .22 })),
      purple: material(new THREE.MeshStandardMaterial({ color: 0x8d67d5, roughness: .62 })),
      orange: material(new THREE.MeshStandardMaterial({ color: 0xf19a4b, roughness: .64 })),
      white: material(new THREE.MeshStandardMaterial({ color: 0xeaf5ff, roughness: .55 })),
      dark: material(new THREE.MeshStandardMaterial({ color: 0x182132, metalness: .45, roughness: .58 }))
    };
    const collisionBoxes = [];
    const placements = [
      { id: "research-lab", label: "Starlight Research Lab", x: -20, z: -13, accent: mats.purple },
      { id: "explorer-hangar", label: "Explorer Hangar", x: 18, z: 14, accent: mats.orange }
    ];

    function mesh(parent, geo, mat, x, y, z, sx, sy, sz) {
      const object = new THREE.Mesh(geo, mat);
      object.position.set(x, y, z);
      object.scale.set(sx, sy, sz);
      object.castShadow = false;
      object.receiveShadow = false;
      parent.add(object);
      return object;
    }

    function addCollision(place, minX, maxX, minZ, maxZ, kind) {
      collisionBoxes.push({
        minX: place.x + minX,
        maxX: place.x + maxX,
        minZ: place.z + minZ,
        maxZ: place.z + maxZ,
        kind,
        structureId: place.id
      });
    }

    function shell(place) {
      const building = new THREE.Group();
      building.name = place.id;
      building.position.set(place.x, 0, place.z);
      group.add(building);
      // Keep the interior slab above the moon terrain and start walls above the
      // slab. The old shared y=0 faces flickered as the camera moved.
      const floor = mesh(building, box, mats.floor, 0, .08, 0, 19.72, .12, 19.72);
      floor.receiveShadow = true;

      // Open roof, 5-unit doorway centered on the south/front wall.
      mesh(building, box, mats.wall, 0, 2.26, -9.8, 20, 4.28, .4);
      mesh(building, box, mats.wall, -9.8, 2.26, 0, .4, 4.28, 20);
      mesh(building, box, mats.wall, 9.8, 2.26, 0, .4, 4.28, 20);
      mesh(building, box, mats.wall, -6.25, 2.26, 9.8, 7.5, 4.28, .4);
      mesh(building, box, mats.wall, 6.25, 2.26, 9.8, 7.5, 4.28, .4);
      mesh(building, box, place.accent, 0, 4.05, 10.06, 5, .7, .12);
      // Windows sit clearly in front of the exterior wall instead of inside it.
      [-8.7, 8.7].forEach(x => mesh(building, box, mats.glass, x, 2.25, 10.025, 1.25, 1.45, .08));
      addCollision(place, -10, 10, -10, -9.55, "wall");
      addCollision(place, -10, -9.55, -10, 10, "wall");
      addCollision(place, 9.55, 10, -10, 10, "wall");
      addCollision(place, -10, -2.5, 9.55, 10, "wall");
      addCollision(place, 2.5, 10, 9.55, 10, "wall");
      return building;
    }

    function buildLab(place) {
      const building = shell(place);
      // Central experiment table, twin analysis desks, specimen tanks and server bank.
      mesh(building, cylinder, mats.white, 0, .65, -1, 2.2, 1.15, 2.2);
      mesh(building, cylinder, mats.glass, 0, 1.45, -1, 1.35, .55, 1.35);
      [-6, 6].forEach(x => {
        mesh(building, box, mats.trim, x, .72, 1.5, 3, 1.35, 1.2);
        mesh(building, box, mats.glass, x, 1.62, 1.25, 2.3, .85, .14);
      });
      [-7.2, -4.8, 4.8, 7.2].forEach(x => {
        mesh(building, cylinder, mats.dark, x, 1.4, -7.6, 1.05, 2.7, 1.05);
        mesh(building, sphere, mats.glass, x, 2.2, -7.6, .72, 1.3, .72);
      });
      mesh(building, box, mats.dark, 0, 1.35, -9.25, 5, 2.55, .45);
      addCollision(place, -2.35, 2.35, -3.3, 1.3, "experiment-table");
      addCollision(place, -7.7, -4.3, .75, 2.3, "analysis-desk");
      addCollision(place, 4.3, 7.7, .75, 2.3, "analysis-desk");
      addCollision(place, -8.4, -3.7, -8.8, -6.4, "specimen-tanks");
      addCollision(place, 3.7, 8.4, -8.8, -6.4, "specimen-tanks");
    }

    function buildHangar(place) {
      const building = shell(place);
      // A compact rover with a clear walking loop around it.
      mesh(building, box, mats.orange, 0, 1.05, -1.6, 6, 1.25, 3.6);
      mesh(building, box, mats.glass, 0, 1.85, -1.35, 3.1, 1, 2.2);
      [-2.45, 2.45].forEach(x => [-2.7, -.5].forEach(z => {
        const wheel = mesh(building, cylinder, mats.dark, x, .6, z, .75, .42, .75);
        wheel.rotation.z = Math.PI / 2;
      }));
      // Tool benches and cargo remain along the perimeter, preserving the doorway lane.
      [-7.4, 7.4].forEach(x => {
        mesh(building, box, mats.trim, x, .75, -2, 2.7, 1.35, 6.5);
        [-4, -2, 0].forEach(z => mesh(building, box, mats.orange, x, 1.6, z, 1.5, .55, 1.4));
      });
      [[-6.8, 6.6], [-4.8, 6.6], [5.7, 6.7], [7.2, 5.2]].forEach(([x, z], i) => {
        mesh(building, box, i % 2 ? mats.white : mats.purple, x, .65, z, 1.45, 1.25, 1.45);
      });
      addCollision(place, -3.35, 3.35, -3.7, .5, "rover");
      addCollision(place, -8.9, -6, -5.4, 1.4, "tool-bench");
      addCollision(place, 6, 8.9, -5.4, 1.4, "tool-bench");
      addCollision(place, -7.7, -3.9, 5.7, 7.5, "cargo");
      addCollision(place, 4.8, 8.1, 4.3, 7.7, "cargo");
    }

    buildLab(placements[0]);
    buildHangar(placements[1]);

    return {
      group,
      collisionBoxes,
      placements: placements.map(({ id, label, x, z }) => ({
        id, label, x, z,
        footprint: { width: 20, depth: 20 },
        entrance: { side: "south", centerX: x, centerZ: z + 10, width: 5 },
        openRoof: true
      })),
      dispose() {
        group.parent?.remove(group);
        resources.forEach(resource => resource.dispose?.());
      }
    };
  };
})();
