(function () {
  "use strict";

  window.beachStructureFactories = window.beachStructureFactories || {};

  window.beachStructureFactories.cafe = function cafe(THREE) {
    const group = new THREE.Group();
    group.name = "open-air-beach-cafe";
    const resources = [];
    const geometry = value => (resources.push(value), value);
    const material = value => (resources.push(value), value);
    const boxGeometry = geometry(new THREE.BoxGeometry(1, 1, 1));
    const cylinderGeometry = geometry(new THREE.CylinderGeometry(.5, .5, 1, 8));
    const mats = {
      floor: material(new THREE.MeshStandardMaterial({ color: 0xf3cf91, roughness: .95 })),
      wall: material(new THREE.MeshStandardMaterial({ color: 0xffe5b4, roughness: .9 })),
      trim: material(new THREE.MeshStandardMaterial({ color: 0x48a9a6, roughness: .8 })),
      wood: material(new THREE.MeshStandardMaterial({ color: 0xa7693f, roughness: .9 })),
      coral: material(new THREE.MeshStandardMaterial({ color: 0xff7f7a, roughness: .78 })),
      cream: material(new THREE.MeshStandardMaterial({ color: 0xfff7dc, roughness: .9 })),
      green: material(new THREE.MeshStandardMaterial({ color: 0x70b86d, roughness: .9 }))
    };

    function mesh(geo, mat, x, y, z, sx, sy, sz, parent = group) {
      const object = new THREE.Mesh(geo, mat);
      object.position.set(x, y, z);
      object.scale.set(sx, sy, sz);
      object.castShadow = false;
      object.receiveShadow = false;
      parent.add(object);
      return object;
    }

    // A shallow base clearly marks the café without creating a step-sized obstacle.
    const floor = mesh(boxGeometry, mats.floor, 0, .04, 0, 7, .08, 7);
    floor.receiveShadow = true;

    // Back and side walls; the front has a generous centered 2.4-unit doorway.
    mesh(boxGeometry, mats.wall, 0, 1.45, -3.35, 7, 2.9, .22);
    mesh(boxGeometry, mats.wall, -3.39, 1.45, 0, .22, 2.9, 6.8);
    mesh(boxGeometry, mats.wall, 3.39, 1.45, 0, .22, 2.9, 6.8);
    mesh(boxGeometry, mats.wall, -2.3, 1.45, 3.35, 2.2, 2.9, .22);
    mesh(boxGeometry, mats.wall, 2.3, 1.45, 3.35, 2.2, 2.9, .22);
    mesh(boxGeometry, mats.trim, 0, 2.72, 3.34, 2.4, .34, .25);

    // Serving counter leaves clear circulation from the doorway into the room.
    mesh(boxGeometry, mats.wood, 0, .62, -1.95, 3.5, 1.24, .7);
    mesh(boxGeometry, mats.cream, 0, 1.29, -1.95, 3.8, .12, .86);
    [[-1.2, -1.48], [0, -1.48], [1.2, -1.48]].forEach(([x, z]) => {
      mesh(cylinderGeometry, mats.coral, x, .43, z, .31, .8, .31);
      mesh(cylinderGeometry, mats.cream, x, .87, z, .48, .08, .48);
    });

    // Two compact café sets tucked to either side of the entrance path.
    [[-2, .65], [2, .65]].forEach(([x, z]) => {
      mesh(cylinderGeometry, mats.wood, x, .46, z, .18, .86, .18);
      mesh(cylinderGeometry, mats.cream, x, .91, z, .72, .10, .72);
      [-.9, .9].forEach(offset => {
        mesh(boxGeometry, mats.trim, x + offset, .5, z, .62, .12, .62);
        mesh(boxGeometry, mats.wood, x + offset, .25, z, .13, .5, .13);
      });
    });

    // A bright sign and small plant make the open front readable from the beach.
    const sign = mesh(boxGeometry, mats.coral, -2.27, 2.18, 3.49, 1.42, .72, .12);
    sign.userData.label = "BEACH CAFE";
    mesh(cylinderGeometry, mats.cream, 2.72, .32, 2.62, .42, .55, .42);
    const plant = mesh(cylinderGeometry, mats.green, 2.72, .88, 2.62, .52, .75, .52);
    plant.scale.y = .9;

    // Local-space rectangles: the beach world can offset these by group.position.
    const collisionBoxes = [
      { minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: -3.22, kind: "wall" },
      { minX: -3.5, maxX: -3.22, minZ: -3.5, maxZ: 3.5, kind: "wall" },
      { minX: 3.22, maxX: 3.5, minZ: -3.5, maxZ: 3.5, kind: "wall" },
      { minX: -3.5, maxX: -1.15, minZ: 3.22, maxZ: 3.5, kind: "wall" },
      { minX: 1.15, maxX: 3.5, minZ: 3.22, maxZ: 3.5, kind: "wall" },
      { minX: -1.9, maxX: 1.9, minZ: -2.4, maxZ: -1.5, kind: "counter" }
    ];

    return {
      group,
      collisionBoxes,
      metadata: {
        id: "beach-cafe",
        label: "Beach Café",
        footprint: { width: 7, depth: 7 },
        entrance: { side: "south", centerX: 0, width: 2.3 },
        openRoof: true
      },
      dispose() {
        group.parent?.remove(group);
        resources.forEach(resource => resource.dispose?.());
      }
    };
  };
})();
