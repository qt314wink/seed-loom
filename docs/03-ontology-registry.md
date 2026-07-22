# Document 3 — Ontology Registry

Status: v0.1 draft  
Purpose: define the first controlled vocabulary for the Visual Ontology Compiler.

## 1. Registry rule

The Ontology Registry prevents the system from becoming a pile of inconsistent labels.

Every term should have:

- canonical name
- definition
- family
- aliases
- allowed values
- incompatible values
- compiler mappings
- QA notes

Chosen decision: maintain a controlled vocabulary rather than freeform tags only.

Reason: freeform tags are good for discovery but poor for validation, transformation, and rendering.

Alternative: open tagging only. Earmark for user annotations, not core logic.

## 2. Top-level domains

Primary domains:

- material
- surface_physics
- depth
- pattern
- craft_process
- cultural_context
- prompt_component
- code_compiler_target
- qa_category
- governance_state
- mutation_type

## 3. Material ontology families

Starter material families:

- wood
- paper
- fabric
- yarn_and_handmade
- leather_and_organic
- stone
- marble
- metal
- glass
- acrylic
- resin
- epoxy
- silicone
- ceramic
- tile
- fur
- feathers
- optical_finish
- inlay

Wood starter subtypes:

- white_oak
- red_oak
- walnut
- black_walnut
- maple
- cherry
- ash
- birch
- mahogany
- teak
- pine
- cedar
- ebony
- olive_wood
- zebrawood
- burl_wood

Wood grain variants:

- straight_grain
- cathedral_grain
- rift_sawn
- quarter_sawn
- flat_sawn
- curly
- birdseye
- burl
- flame
- ribbon_stripe
- spalted
- end_grain
- bookmatched
- herringbone_veneer
- chevron_veneer
- marquetry

Paper variants:

- cotton_rag
- handmade_paper
- rice_paper
- vellum
- kraft
- cardstock
- newsprint
- tissue
- mulberry
- watercolor_paper

Fabric variants:

- linen
- cotton
- silk
- satin
- velvet
- wool
- merino
- cashmere
- felt
- fleece
- denim
- canvas
- lace
- tulle
- organza
- burlap
- jacquard
- brocade
- technical_mesh

Yarn and handmade variants:

- knit
- rib_knit
- cable_knit
- crochet
- amigurumi
- macrame
- embroidery
- needle_felt
- wet_felt
- tufted
- quilted

Stone and marble variants:

- carrara_marble
- calacatta_marble
- travertine
- limestone
- sandstone
- slate
- granite
- basalt
- obsidian
- quartzite
- soapstone
- onyx
- jade
- alabaster
- terrazzo
- concrete

Metal variants:

- brass
- bronze
- copper
- patinated_copper
- aluminum
- brushed_aluminum
- stainless_steel
- iron
- chrome
- gold_leaf
- silver_leaf
- rose_gold
- titanium

Optical finishes:

- matte
- eggshell
- satin
- semi_gloss
- gloss
- high_gloss
- mirror
- metallic
- brushed_metallic
- pearlescent
- iridescent
- opalescent
- dichroic
- holographic
- prismatic
- thin_film_interference
- speckled
- frosted

## 4. Surface physics ontology

Noise types:

- perlin
- simplex
- value_noise
- cellular_worley
- blue_noise
- fbm
- ridged_multifractal
- curl_noise
- domain_warp
- marble_noise
- voronoi
- reaction_diffusion
- grain
- halftone
- stipple
- crosshatch
- paper_fiber
- lithographic_grain
- risograph_dot

Canonical surface values:

- feature_scale
- feature_density
- amplitude
- directionality
- regularity
- scatter
- warp
- octaves
- lacunarity
- gain
- displacement_strength
- normal_strength
- roughness
- reflectance
- specular_variation

## 5. Depth grammar ontology

Depth levels:

- floating: +6
- suspended: +5
- applied_ornament: +4
- raised_relief: +3
- embossed: +2
- surface_texture: +1
- base_plane: 0
- engraved: -1
- debossed: -2
- inset: -3
- carved_channel: -4
- deep_relief: -5
- through_cut: -6

Edge profiles:

- sharp
- micro_bevel
- chamfer
- small_radius
- large_radius
- bullnose
- ogee
- cove
- roundover
- knife_edge
- stepped
- faceted
- chiseled
- live_edge
- torn
- burned
- melted
- folded

## 6. Pattern ontology

Pattern families:

- grid
- radial
- spiral
- tessellation
- mosaic
- marquetry
- inlay
- collage
- botanical
- geometric
- textile_repeat
- relief_stack
- paper_cut
- stipple_field
- halftone_field
- crosshatch_field

Tile arrangements:

- stack_bond
- running_bond
- herringbone
- chevron
- basket_weave
- checkerboard
- penny_round
- fish_scale
- hex_pack
- voronoi_mosaic
- irregular_hand_cut
- gradient_density

## 7. Craft process ontology

Process families:

- additive
- subtractive
- transformative
- assemblage
- print_based
- textile_based
- ceramic_based
- metal_based
- stone_based
- algorithmic

Techniques:

- woodblock_printing
- linocut
- engraving
- etching
- lithography
- risograph
- screen_printing
- paper_cutting
- collage
- marquetry
- intarsia
- mosaic
- embroidery
- weaving
- knitting
- crochet
- amigurumi
- ceramic_glazing
- gold_leaf_application
- stone_carving
- algorithmic_drawing
- procedural_shader_patterning

## 8. Governance states

Lifecycle states:

- draft
- observed
- defined
- tested
- approved
- production
- experimental
- dormant
- rejected
- deprecated
- archived

Mutation types:

- material_swap
- finish_swap
- depth_adjustment
- arrangement_change
- noise_scale_adjustment
- color_temperature_shift
- craft_process_substitution
- prompt_variation
- code_rendering_variation

## 9. QA categories

- identity_fit
- material_plausibility
- depth_plausibility
- surface_coherence
- craft_plausibility
- cultural_confidence
- prompt_clarity
- code_feasibility
- complexity_control
- novelty_control
- accessibility
- performance

## 10. Registry growth protocol

New terms enter as proposed. They become approved only after receiving definition, family, aliases, constraints, compiler mappings, and at least one example.
