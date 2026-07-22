# Document 4 — Material Genome and Surface Physics Spec

Status: v0.1 draft
Purpose: define materials with values, surface behavior, compatible pairings, forbidden pairings, and compiler mappings.

## 1. Core decision

Materials are not stored as names only. Each material is defined by identity plus behavior.

A material record includes:

- family
- subtype
- variant
- hardness
- flexibility
- density
- porosity
- transparency
- reflectance
- roughness
- gloss
- displacement_strength
- normal_strength
- feature_scale
- feature_density
- directionality
- regularity
- scatter
- aging_state
- finish
- compatible_materials
- forbidden_materials
- prompt_language
- css_svg_mapping
- webgl_mapping
- qa_rules

Chosen decision: canonical material profile first, renderer-specific values second.

Reason: SVG, CSS, WebGL, Figma, and AI prompts are output targets. The canonical material profile remains stable across tools.

Alternative one: SVG-first values. Earmark for lightweight web packs.
Alternative two: AI-prompt-first language. Earmark for creator-facing prompt tools.

## 2. Universal value scale

Most values use 0.0 to 1.0.

- 0.0 means absent or minimal
- 0.5 means moderate
- 1.0 means maximum or dominant

Human-facing reports may convert these to low, medium, high, or 0 to 100.

## 3. Wood genome

Wood fields:

- species
- cut_direction
- grain_direction
- ring_width
- pore_density
- pore_contrast
- knot_frequency
- figure_type
- color_variation
- finish_gloss
- relief_depth
- aging_state
- noise_model

Starter profile: rift-sawn walnut

- family: wood
- subtype: black_walnut
- cut_direction: rift_sawn
- directionality: 0.86
- pore_contrast: 0.58
- knot_frequency: 0.12
- relief_depth: 0.22
- finish_gloss: 0.36
- roughness: 0.38
- reflectance: 0.22
- displacement_strength: 0.16 to 0.24
- noise_model: directional_flow_noise plus fine_pore_streaks
- compatible: brass, leather, linen, pearl, resin, ceramic, dark_stone
- avoid: neon_acrylic, chrome_overload, flat_plastic_varnish, random_glitter

QA: grain direction must remain coherent unless variant is explicitly burl, spalted, or end grain.

## 4. Paper genome

Paper fields:

- fiber_density
- fiber_length
- fiber_directionality
- tooth
- wrinkle
- deckle_irregularity
- opacity
- absorbency
- surface_compression
- ink_bleed_tendency
- noise_scale
- displacement_strength

Starter profile: handmade cotton rag paper

- fiber_density: 0.72
- fiber_length: 0.68
- tooth: 0.44
- deckle_irregularity: 0.55
- opacity: 0.92
- absorbency: 0.81
- roughness: 0.62
- displacement_strength: 0.08 to 0.16
- noise_model: fine_fiber_noise plus low_frequency_sheet_variation
- compatible: ink, watercolor, charcoal, embossing, letterpress, gold_leaf, collage
- avoid: plastic_gloss, perfect_uniformity, chrome_reflections, synthetic_smoothness

QA: paper substrate and print process must remain separate unless intentionally combined.

## 5. Fabric genome

Fabric fields:

- fiber_type
- thread_diameter
- warp_density
- weft_density
- weave_or_stitch_type
- pile_height
- fuzz
- stretch
- compression
- drape
- opacity
- sheen
- relief_depth
- pattern_repeat

Starter profile: linen

- thread_irregularity: 0.74
- weave_visibility: 0.78
- fuzz: 0.22
- drape: 0.55
- sheen: 0.12
- roughness: 0.68
- displacement_strength: 0.18 to 0.32
- noise_model: woven_grid plus random_slub_variation
- compatible: paper, wood, ceramic, brass, embroidery, botanical_patterns
- avoid: mirror_chrome, latex_gloss, neon_plastic

Starter profile: amigurumi yarn surface

- stitch_repeat: 0.92
- loop_depth: 0.70
- yarn_fuzz: 0.62
- stuffing_compression: 0.52
- roundness: 0.85
- displacement_strength: 0.35 to 0.55
- noise_model: loop_geometry plus fiber_fuzz
- compatible: felt, buttons, embroidery, soft_shadowing
- avoid: hard_metal_edges_without_connector_logic, flat_texture, plastic_skin

## 6. Stone and marble genome

Stone fields:

- stone_family
- mineral_density
- crystal_size
- vein_density
- vein_width
- vein_contrast
- vein_curvature
- pitting
- porosity
- polish
- edge_chipping
- translucency
- reflectance
- displacement_strength

Starter profile: Carrara marble

- crystal_size: 0.34
- vein_density: 0.42
- vein_contrast: 0.48
- vein_curvature: 0.62
- pitting: 0.08
- porosity: 0.12
- polish: 0.82
- reflectance: 0.46
- displacement_strength: 0.03 to 0.08
- noise_model: marble_flow_noise, curl_warp, subtle_crystalline_sparkle
- compatible: brass, bronze, pearl, glass, polished_resin, museum_lighting
- avoid: heavy_grain_displacement, muddy_veins, plastic_sheen

Starter profile: travertine

- pitting: 0.72
- porosity: 0.78
- vein_contrast: 0.32
- polish: 0.36 when honed
- displacement_strength: 0.22 to 0.42
- noise_model: cellular_pitting plus sedimentary_bands
- compatible: matte_ceramic, brass, limestone, warm_grout
- avoid: flawless_mirror_finish unless filled and polished

## 7. Metal and inlay genome

Metal fields:

- metal_type
- polish
- oxidation
- anisotropy
- reflectance
- roughness
- edge_wear
- patina
- fabrication_method

Starter profile: brushed brass inlay

- hardness: 0.78
- reflectance: 0.72
- roughness: 0.22
- anisotropy: 0.68
- oxidation: 0.18
- displacement_strength: 0.02 to 0.05
- compatible: walnut, marble, leather, ceramic, glass, resin
- avoid: random_glitter, neon_gold, impossible_shadow, unseated_floating_inlay

## 8. Resin, epoxy, acrylic, silicone

Resin fields:

- transparency
- tint
- internal_scatter
- suspended_particle_density
- gloss
- refraction
- fill_depth
- cure_surface

Starter profile: translucent amber resin inlay

- transparency: 0.62
- gloss: 0.86
- internal_scatter: 0.34
- suspended_particle_density: 0.18
- reflectance: 0.58
- displacement_strength: 0.01 to 0.04
- compatible: carved_wood_channels, brass_particles, pearl_fragments, stone_inlay
- avoid: glitter_overload, floating_without_channel, muddy_opacity

Silicone fields:

- softness
- elasticity
- translucency
- tackiness
- matte_or_gloss
- deformation

## 9. Optical finish families

Optical finishes include:

- matte
- satin
- gloss
- mirror
- metallic
- brushed_metallic
- pearlescent
- opalescent
- iridescent
- dichroic
- holographic
- prismatic
- thin_film_interference
- speckled
- frosted

QA: optical finish must align with material logic. Pearlescence can belong to shell, pearl, glaze, resin, or coating. It should not be randomly applied to every material without a defined coating or finish layer.

## 10. Compiler mappings

CSS/SVG mapping uses:

- layered backgrounds
- masks
- feTurbulence
- feDisplacementMap
- feDiffuseLighting
- feSpecularLighting
- inner shadows
- drop shadows
- blend modes

WebGL mapping uses:

- baseColor
- roughness
- metalness
- normalScale
- displacementScale
- clearcoat
- transmission
- IOR
- anisotropy
- sheen
- environment reflection

Prompt mapping uses construction-aware language:

Weak: beautiful wood and gold.

Strong: satin rift-sawn walnut with directional grain, shallow carved channels filled with flush translucent amber resin and brushed brass inlay, physically plausible shadows, low-amplitude grain displacement.
