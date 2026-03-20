# Index of Refraction (IOR) Reference

Measured IOR values for real-world materials. Use these when setting `ior` on `MeshPhysicalMaterial`.

**Three.js constraint:** `ior` is clamped to `[1.0, 2.333]`. Values outside this range are clamped automatically.

**The relationship:** `reflectivity = 2.5 * (ior - 1) / (ior + 1)`. Higher IOR = stronger reflections at normal incidence.

---

## Common Materials

| Material | IOR | Notes |
|----------|-----|-------|
| **Vacuum / Air** | 1.000 | Baseline — no refraction |
| **Water (20°C)** | 1.333 | Clean water, pools |
| **Ice** | 1.309 | Frozen water |
| **Teflon (PTFE)** | 1.350-1.380 | Non-stick surfaces |
| **Plastic (general)** | 1.460 | Default plastic |
| **Acrylic / PMMA / Plexiglas** | 1.490 | Display cases, light pipes |
| **Window Glass (soda-lime)** | 1.500-1.520 | Standard glass |
| **Gorilla Glass / Ceramic Shield** | 1.500-1.520 | Phone screen glass |
| **Crown Glass** | 1.520 | Optical glass (low dispersion) |
| **Rubber** | 1.519 | Natural rubber |
| **Nylon** | 1.530 | Synthetic fibers |
| **Epoxy Resin** | 1.540-1.560 | Carbon fiber matrix |
| **Polycarbonate** | 1.584 | Safety glass, phone cases |
| **Flint Glass** | 1.600-1.620 | Optical glass (high dispersion) |
| **Ceramic (glazed)** | 1.650 | Pottery, tiles |
| **Sapphire / Ruby** | 1.757-1.779 | Watch crystals, camera lens covers |
| **Optical Glass (high-index)** | 1.700-1.900 | Camera lenses |
| **Crystal (lead glass)** | 2.000 | Chandeliers, decorative |
| **Zirconia (cubic)** | 2.150 | Diamond simulant |
| **Titanium dioxide** | 2.160 | White pigment |
| **Diamond** | 2.418 | Beyond Three.js clamp — use 2.333 max |

## Metals (for reference only)

Metal IOR values are complex numbers (real + imaginary). Three.js handles metals via `metalness: 1` + `color` rather than IOR. These are listed for reference:

| Metal | IOR (real part) | Notes |
|-------|----------------|-------|
| Aluminum | 1.244-1.440 | Varies with wavelength |
| Silver | 0.180 | Very low real part — handled by metalness |
| Gold | 0.470 | Handled by metalness + color |
| Copper | 0.640 | Handled by metalness + color |
| Iron | 2.950 | Structural steel |
| Chromium | 2.970 | Chrome plating |
| Steel | 2.500 | Stainless/carbon |

**For metals in Three.js:** Do not set `ior`. Instead use `metalness: 1` and set `color` to the metal's characteristic color. The reflection behavior is computed from metalness, not IOR.

---

## Choosing the Right IOR

1. **Default:** `1.5` is glass. When unsure, use 1.5.
2. **Plastics:** 1.46-1.58 depending on type. Polycarbonate (1.584) is the most reflective common plastic.
3. **Optical elements:** 1.7-1.9 for camera lenses, eyeglass lenses.
4. **Water:** 1.333. Ice: 1.309.
5. **Gems:** 1.75+ for sapphire, 2.0+ for crystal, 2.333 (max) for diamond.
6. **Higher IOR = more reflection.** A glass at IOR 1.8 reflects ~8% of light at normal incidence vs ~4% at IOR 1.5.
