# Beach token collision QA

Validated at 1280 × 720 using the deterministic `?beachPose=tokenDash` route.

- Screenshot: `open-sand-route.png`
- Scene: Beach, asset status `ready`
- Quest: active, six tokens loaded
- Route: all pickup coordinates use shoreline-side sand (`z <= 3`) and clear conservative 16 × 16 visual-footprint exclusion zones around both near-beach buildings.
- Performance: 134 render calls / 42,159 triangles, within the Beach budget of 140 calls.

The screenshot confirms that no pickup intersects a building, road, or water surface. The integration test now rejects future positions that enter either near-beach building footprint.
