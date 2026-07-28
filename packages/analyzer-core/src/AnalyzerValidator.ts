import { z } from "zod";
import { ENGINE_TYPES, SOURCE_KINDS } from "./contracts.js";

const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const RegionSchema = z.object({
  id: z.string().min(1),
  bounds: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }),
});

export const EvidenceClaimSchema = z.object({
  id: z.string().min(1),
  predicate: z.string().min(1),
  value: JsonValueSchema,
  confidence: z.number().min(0).max(1),
  regionIds: z.array(z.string()),
  method: z.string().optional(),
});

export const InterpretationSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(z.string()),
  alternatives: z.array(z.string()),
  disambiguationQuestion: z.string().nullable().optional(),
});

export const TokenSchema = z.object({
  path: z.string().min(1),
  value: JsonValueSchema,
  class: z.enum([
    "primitive",
    "semantic",
    "component",
    "motion",
    "shader",
    "symbol",
    "constraint",
  ]),
  evidenceIds: z.array(z.string()),
  interpretationIds: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const TranslationSchema = z.object({
  target: z.enum([
    "css",
    "tailwind",
    "figma",
    "react",
    "motion",
    "glsl",
    "svg",
    "prompt",
    "json",
  ]),
  artifact: JsonValueSchema,
  sourceTokenPaths: z.array(z.string()),
});

export const VerificationCheckSchema = z
  .object({
    id: z.string().optional(),
    status: z.enum(["pass", "fail", "warning"]).optional(),
    message: z.string().optional(),
  })
  .passthrough();

export const ProviderAnalyzerOutputSchema = z.object({
  evidence: z.array(EvidenceClaimSchema),
  interpretations: z.array(InterpretationSchema),
  tokens: z.array(TokenSchema),
  translations: z.array(TranslationSchema),
  verification: z
    .object({
      traceabilityCoverage: z.number().min(0).max(1).optional(),
      unsupportedClaims: z.number().int().min(0).optional(),
      checks: z.array(VerificationCheckSchema).optional(),
    })
    .optional(),
});

export const AnalyzerResultSchema = z.object({
  run: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
    createdAt: z.iso.datetime(),
    engine: z.union([z.enum(ENGINE_TYPES), z.string().min(1)]),
    parentRunId: z.string().nullable().optional(),
  }),
  source: z.object({
    id: z.string().min(1),
    kind: z.enum(SOURCE_KINDS),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    uri: z.string().nullable().optional(),
    regions: z.array(RegionSchema).optional(),
  }),
  evidence: z.array(EvidenceClaimSchema),
  interpretations: z.array(InterpretationSchema),
  tokens: z.array(TokenSchema),
  translations: z.array(TranslationSchema),
  verification: z.object({
    traceabilityCoverage: z.number().min(0).max(1),
    unsupportedClaims: z.number().int().min(0),
    checks: z.array(VerificationCheckSchema),
  }),
});

export type ProviderAnalyzerOutput = z.infer<typeof ProviderAnalyzerOutputSchema>;
export type AnalyzerResult = z.infer<typeof AnalyzerResultSchema>;
export type EvidenceClaim = z.infer<typeof EvidenceClaimSchema>;
export type Interpretation = z.infer<typeof InterpretationSchema>;
export type AnalyzerToken = z.infer<typeof TokenSchema>;
export type Translation = z.infer<typeof TranslationSchema>;
