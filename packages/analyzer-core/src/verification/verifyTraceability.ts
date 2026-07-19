import type { ProviderAnalyzerOutput } from "../AnalyzerValidator.js";

export interface TraceabilityCheck {
  id: string;
  status: "pass" | "fail" | "warning";
  message: string;
  unresolved?: string[];
}

export interface TraceabilityVerification {
  traceabilityCoverage: number;
  unsupportedClaims: number;
  checks: TraceabilityCheck[];
}

export class TraceabilityError extends Error {
  constructor(
    message: string,
    readonly verification: TraceabilityVerification,
  ) {
    super(message);
    this.name = "TraceabilityError";
  }
}

export function verifyTraceability(
  output: ProviderAnalyzerOutput,
): TraceabilityVerification {
  const evidenceIds = new Set(output.evidence.map((claim) => claim.id));
  const interpretationIds = new Set(output.interpretations.map((item) => item.id));
  const tokenPaths = new Set(output.tokens.map((token) => token.path));

  const unresolvedInterpretationEvidence = output.interpretations.flatMap((item) =>
    item.evidenceIds
      .filter((id) => !evidenceIds.has(id))
      .map((id) => `${item.id}->${id}`),
  );
  const unresolvedTokenEvidence = output.tokens.flatMap((token) =>
    token.evidenceIds
      .filter((id) => !evidenceIds.has(id))
      .map((id) => `${token.path}->${id}`),
  );
  const unresolvedTokenInterpretations = output.tokens.flatMap((token) =>
    (token.interpretationIds ?? [])
      .filter((id) => !interpretationIds.has(id))
      .map((id) => `${token.path}->${id}`),
  );
  const unresolvedTranslationTokens = output.translations.flatMap((translation, index) =>
    translation.sourceTokenPaths
      .filter((path) => !tokenPaths.has(path))
      .map((path) => `translation[${index}]->${path}`),
  );

  const unsupportedInterpretations = output.interpretations.filter(
    (item) => item.evidenceIds.length === 0,
  ).length;
  const unsupportedTokens = output.tokens.filter(
    (token) => token.evidenceIds.length === 0,
  ).length;
  const unsupportedTranslations = output.translations.filter(
    (translation) => translation.sourceTokenPaths.length === 0,
  ).length;

  const totalDerivedClaims =
    output.interpretations.length + output.tokens.length + output.translations.length;
  const supportedDerivedClaims =
    output.interpretations.filter(
      (item) =>
        item.evidenceIds.length > 0 && item.evidenceIds.every((id) => evidenceIds.has(id)),
    ).length +
    output.tokens.filter(
      (token) =>
        token.evidenceIds.length > 0 &&
        token.evidenceIds.every((id) => evidenceIds.has(id)) &&
        (token.interpretationIds ?? []).every((id) => interpretationIds.has(id)),
    ).length +
    output.translations.filter(
      (translation) =>
        translation.sourceTokenPaths.length > 0 &&
        translation.sourceTokenPaths.every((path) => tokenPaths.has(path)),
    ).length;

  const unresolved = [
    ...unresolvedInterpretationEvidence,
    ...unresolvedTokenEvidence,
    ...unresolvedTokenInterpretations,
    ...unresolvedTranslationTokens,
  ];

  const unsupportedClaims =
    unsupportedInterpretations +
    unsupportedTokens +
    unsupportedTranslations +
    unresolved.length;

  return {
    traceabilityCoverage:
      totalDerivedClaims === 0 ? 1 : supportedDerivedClaims / totalDerivedClaims,
    unsupportedClaims,
    checks: [
      {
        id: "reference-integrity",
        status: unresolved.length === 0 ? "pass" : "fail",
        message:
          unresolved.length === 0
            ? "All evidence, interpretation, and token references resolve."
            : `${unresolved.length} unresolved reference(s) detected.`,
        ...(unresolved.length > 0 ? { unresolved } : {}),
      },
      {
        id: "derived-claim-support",
        status:
          unsupportedInterpretations + unsupportedTokens + unsupportedTranslations === 0
            ? "pass"
            : "fail",
        message:
          unsupportedInterpretations + unsupportedTokens + unsupportedTranslations === 0
            ? "Every interpretation, token, and translation cites its supporting source."
            : "One or more derived claims contain no supporting references.",
      },
    ],
  };
}

export function assertTraceability(output: ProviderAnalyzerOutput): TraceabilityVerification {
  const verification = verifyTraceability(output);
  if (verification.unsupportedClaims > 0) {
    throw new TraceabilityError(
      "Analyzer output failed local traceability verification.",
      verification,
    );
  }
  return verification;
}
