(function () {
  "use strict";

  window.beachStructureFactories = window.beachStructureFactories || {};

  window.beachStructureFactories.surfShop = function surfShop(THREE) {
    const group = new THREE.Group();
    group.name = "beach-surf-shop";

    const resources = [];
    const geometry = value => (resources.push(value), value);
    const material = value => (resources.push(value), value);
    const box = geometry(new THREE.BoxGeometry(1, 1, 1));
    const cylinder = geometry(new THREE.CylinderGeometry(0.5, 0.5, 1, 10));
    const boardGeometry = geometry(new THREE.CapsuleGeometry(0.34, 1.75, 4, 8));
    const mats = {
      floor: material(new THREE.MeshStandardMaterial({ color: 0xf3d39a, roughness: 0.95 })),
      wall: material(new THREE.MeshStandardMaterial({ color: 0x35a9b5, roughness: 0.8 })),
      trim: material(new THREE.MeshStandardMaterial({ color: 0xfff2c7, roughness: 0.75 })),
      wood: material(new THREE.MeshStandardMaterial({ color: 0x9b633e, roughness: 0.92 })),
      coral: material(new THREE.MeshStandardMaterial({ color: 0xff705f, roughness: 0.7 })),
      yellow: material(new THREE.MeshStandardMaterial({ color: 0xffd454, roughness: 0.7 })),
      aqua: material(new THREE.MeshStandardMaterial({ color: 0x41d1c3, roughness: 0.7 })),
      navy: material(new THREE.MeshStandardMaterial({ color: 0x22517a, roughness: 0.75 })),
      rope: material(new THREE.MeshStandardMaterial({ color: 0xd8b276, roughness: 1 }))
    };

    function mesh(shape, mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = group) {
      const object = new THREE.Mesh(shape, mat);
      object.position.set(x, y, z);
      object.scale.set(sx, sy, sz);
      object.castShadow = false;
      object.receiveShadow = false;
      parent.add(object);
      return object;
    }

    // Seven-by-seven open-air shop. The front opening is 3.4 units wide.
    const floor = mesh(box, mats.floor, 0, 0.1, 0, 7, 0.2, 7);
    floor.receiveShadow = true;
    mesh(box, mats.wall, 0, 1.7, -3.4, 7, 3.4, 0.2);
    mesh(box, mats.wall, -3.4, 1.7, 0, 0.2, 3.4, 7);
    mesh(box, mats.wall, 3.4, 1.7, 0, 0.2, 3.4, 7);
    mesh(box, mats.wall, -2.55, 1.7, 3.4, 1.7, 3.4, 0.2);
    mesh(box, mats.wall, 2.55, 1.7, 3.4, 1.7, 3.4, 0.2);

    // Cream trim and a bright sign keep the shop distinct from the beach cafe.
    mesh(box, mats.trim, 0, 3.25, -3.25, 6.75, 0.18, 0.16);
    mesh(box, mats.trim, -3.25, 3.25, 0, 0.16, 0.18, 6.75);
    mesh(box, mats.trim, 3.25, 3.25, 0, 0.16, 0.18, 6.75);
    mesh(box, mats.coral, 0, 3.65, -3.52, 3.6, 0.72, 0.12);
    [-1.35, -0.45, 0.45, 1.35].forEach((x, index) =>
      mesh(box, index % 2 ? mats.yellow : mats.trim, x, 3.65, -3.59, 0.16, 0.46, 0.05)
    );

    // Checkout counter leaves a clear path from the broad doorway.
    mesh(box, mats.wood, 1.55, 0.65, -1.95, 2.75, 1.25, 0.72);
    mesh(box, mats.trim, 1.55, 1.32, -1.95, 3, 0.12, 0.9);
    mesh(box, mats.navy, 2.2, 1.63, -1.95, 0.55, 0.5, 0.2);

    // Two compact surf racks with six visibly different boards.
    const boardColors = [mats.coral, mats.yellow, mats.aqua, mats.navy, mats.yellow, mats.coral];
    function surfRack(x, z, rotation) {
      const rack = new THREE.Group();
      rack.position.set(x, 0, z);
      rack.rotation.y = rotation;
      group.add(rack);
      mesh(box, mats.wood, 0, 0.4, 0, 2.15, 0.12, 0.55, rack);
      mesh(box, mats.wood, 0, 1.65, 0, 2.15, 0.12, 0.55, rack);
      [-0.72, 0, 0.72].forEach((bx, index) => {
        const board = mesh(boardGeometry, boardColors[index + (x > 0 ? 3 : 0)], bx, 1.25, 0, 0.52, 0.85, 0.22, rack);
        board.rotation.z = index % 2 ? -0.08 : 0.08;
        mesh(box, mats.trim, bx, 1.32, -0.23, 0.08, 1.25, 0.04, rack);
      });
    }
    surfRack(-2.45, -0.75, Math.PI / 2);
    surfRack(2.75, 0.9, Math.PI / 2);

    // Beach gear display: rolled towels, a basket, and stacked float rings.
    [-0.7, 0, 0.7].forEach((x, index) => {
      const towel = mesh(cylinder, [mats.coral, mats.aqua, mats.yellow][index], x, 0.42, 1.9, 0.34, 0.9, 0.34);
      towel.rotation.z = Math.PI / 2;
    });
    mesh(box, mats.rope, 0, 0.26, 1.9, 2.6, 0.15, 0.9);
    const ringGeometry = geometry(new THREE.TorusGeometry(0.46, 0.14, 7, 14));
    [0.55, 1.05].forEach((y, index) => {
      const ring = mesh(ringGeometry, index ? mats.yellow : mats.coral, -2.35, y, 2.15);
      ring.rotation.x = Math.PI / 2;
    });

    const collisionBoxes = [
      { x: 0, z: -3.4, width: 7, depth: 0.28, type: "wall" },
      { x: -3.4, z: 0, width: 0.28, depth: 7, type: "wall" },
      { x: 3.4, z: 0, width: 0.28, depth: 7, type: "wall" },
      { x: -2.55, z: 3.4, width: 1.7, depth: 0.28, type: "wall" },
      { x: 2.55, z: 3.4, width: 1.7, depth: 0.28, type: "wall" },
      { x: 1.55, z: -1.95, width: 3, depth: 0.95, type: "counter" },
      { x: -2.45, z: -0.75, width: 0.75, depth: 2.4, type: "display" },
      { x: 2.75, z: 0.9, width: 0.75, depth: 2.4, type: "display" }
    ];

    return {
      group,
      collisionBoxes,
      metadata: {
        id: "surf-shop",
        label: "Sunny Side Surf Shop",
        width: 7,
        depth: 7,
        doorwayWidth: 3.4,
        openRoof: true,
        entrance: { x: 0, z: 3.5 }
      },
      dispose() {
        group.parent?.remove(group);
        resources.forEach(resource => resource.dispose?.());
      }
    };
  };
})();
