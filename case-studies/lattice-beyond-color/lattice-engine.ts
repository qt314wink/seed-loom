/** Lattice Beyond Color — deterministic core utilities. No runtime dependencies. */
export type ConceptId = "helioveil" | "echovault" | "faultgarden" | "capillarycommons" | "nacresentinel";

export interface EvidenceRef { id: string; source: string; confidence: number; }
export interface LatticeInput {
  concept: ConceptId;
  seed: number;
  load: number;          // normalized 0..1
  uncertainty: number;   // normalized 0..1
  risk: number;          // normalized 0..1
  angleDeg?: number;
  evidence?: EvidenceRef[];
}
export interface LatticeState {
  spacing: number;
  density: number;
  anisotropy: number;
  defectRate: number;
  roughness: number;
  sheen: number;
  motionMs: number;
  confidence: number;
  trace: string[];
}

const clamp = (v:number, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const mix = (a:number,b:number,t:number) => a + (b-a)*clamp(t);

/** Reproducible variation: same seed + inputs = same state. */
export function mulberry32(seed:number):()=>number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function braggPeakNm(nEffective:number, spacingNm:number, angleDeg:number):number {
  return 2 * nEffective * spacingNm * Math.cos(angleDeg * Math.PI / 180);
}
export function radiativeFlux(emissivity:number, surfaceK:number, skyK:number):number {
  const sigma = 5.670374419e-8;
  return emissivity * sigma * (surfaceK**4 - skyK**4);
}
export function phononicGapHz(soundSpeed:number, pitchMeters:number):number {
  return soundSpeed / (2 * pitchMeters);
}
export function effectiveDiffusivity(diffusivity:number, porosity:number, tortuosity:number):number {
  return diffusivity * porosity / Math.max(tortuosity, 1e-9);
}
export function bayesUpdate(prior:number, likelihood:number, evidenceProbability:number):number {
  return clamp((likelihood * prior) / Math.max(evidenceProbability, 1e-9));
}

export function deriveLatticeState(i:LatticeInput):LatticeState {
  const rnd = mulberry32(i.seed);
  const confidence = clamp(1 - i.uncertainty);
  const jitter = (rnd() - 0.5) * 0.04; // bounded; visible but reproducible
  const base = {
    spacing: mix(0.28, 0.82, i.load), density: mix(0.82, 0.34, i.load),
    anisotropy: mix(0.12, 0.68, i.risk), defectRate: mix(0.01, 0.20, i.uncertainty),
    roughness: mix(0.08, 0.72, i.risk), sheen: mix(0.12, 0.62, confidence),
    motionMs: Math.round(mix(280, 2200, i.uncertainty)), confidence,
    trace: [`concept:${i.concept}`, `seed:${i.seed}`, `confidence:${confidence.toFixed(3)}`]
  };
  switch(i.concept) {
    case 'helioveil': base.spacing=clamp(base.spacing+jitter); base.trace.push('spacing←solar/load'); break;
    case 'echovault': base.density=clamp(1-i.load+jitter); base.motionMs=Math.round(mix(80,420,i.load)); base.trace.push('pitch←target frequency'); break;
    case 'faultgarden': base.defectRate=clamp(i.uncertainty*0.18+jitter); base.trace.push('defects←epistemic state'); break;
    case 'capillarycommons': base.anisotropy=clamp(i.risk*0.35+jitter); base.trace.push('loops←failure budget'); break;
    case 'nacresentinel': base.roughness=clamp(i.risk*0.85+jitter); base.motionMs=Math.round(mix(120,640,i.risk)); base.trace.push('fracture path←attack propagation'); break;
  }
  return base;
}
