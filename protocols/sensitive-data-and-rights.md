# Sensitive Data and Rights Protocol

Sensitive-data and copyright enforcement is a hard ingestion gate, not a scoring
heuristic. The scanner (`scripts/knowledge/scan-sensitive-data.mjs`) emits
verdicts and receipts only; it never accepts knowledge, never mutates canonical
records, and never repairs records in place. Auto-fixes exist only as patch
candidates that require human approval.

Authority: the `sensitiveData` block of `knowledge/config/governance.json`
(classes of action, `maximumCopyrightExcerptWords` = 120, `requirePurposeFor`,
`requireRetentionFor`, `defaultUnknownPersonalAction`). The scanner fails closed
if that block is missing or malformed.

## Classification classes

public, internal, confidential, restricted, personal, sensitive-personal,
health, financial, application, licensed, copyrighted-excerpt,
private-repository, secret, prohibited. Every record should carry a
`dataClassification` block validated against
`knowledge/schema/data-classification.schema.json`.

## Class-action policy

| Class | Required metadata | Missing metadata | Notes |
|---|---|---|---|
| public | none | pass | |
| internal | none | pass | internal is not in `requirePurposeFor` |
| confidential, restricted, personal, sensitive-personal | purpose, minimization, accessBoundary, retention, approval | quarantine (`GOVERNED_METADATA_MISSING`) | governed tier |
| health, financial, application, private-repository | purpose, minimization, accessBoundary, retention, approval | reject (`STRICT_METADATA_MISSING`) | strictest tier; never degrade to quarantine |
| licensed | license, permittedUse, retention | quarantine (`LICENSED_METADATA_MISSING`) | licensed is in `requireRetentionFor` |
| copyrighted-excerpt | license, permittedUse, excerptWordCount, deletionRequirement | reject (`COPYRIGHT_METADATA_MISSING`) | excerpt limits below |
| secret | n/a | reject (`SECRET_DECLARED`) | auth material is never ingested |
| prohibited | n/a | reject (`PROHIBITED_CLASS`) | |

## Secrets and authentication material

API keys, tokens, private keys, and passwords in fields fail ingestion
(`SECRET_DETECTED`). Detection is pattern-based: `sk-…`, `ghp_…`,
`github_pat_…`, `AKIA…`, `xox[baprs]-…`, `AIza…`, JWTs, PEM private-key blocks,
and non-empty fields whose name ends in password/passwd/passphrase/pwd. A
pairwise cross-field scan also catches a secret split across exactly two fields
(`secret-split-across-fields:*`). Receipts never contain a matched secret; they
carry a redacted fingerprint: prefix (at most 4 characters), length, and the
SHA-256 of the match.

## Undeclared personal data

A record lacking `dataClassification` that shows personal-data signals (email
addresses, SSN patterns, date-of-birth fields or phrases, name plus identifier
fields) is quarantined per `defaultUnknownPersonalAction`
(`UNDECLARED_PERSONAL_DATA`). A holding copy with a redaction note goes to
`knowledge/quarantine/sensitive-data/`; the receipt names signal kinds only,
never values. Undeclared records with no signals pass as `unclassified`.
Declared records are trusted on their label and are not re-scanned for
personal signals.

## Copyright and licensed material

Store source facts, short necessary excerpts, summaries, and content hashes —
never full articles for convenience (`FULL_ARTICLE_INGESTION`, reject).
`copyrighted-excerpt` records declare license, permitted use, excerpt word
count, and deletion requirement. The effective word count is the maximum of
the declared count and the scanner's own count of the excerpt text. Above
`maximumCopyrightExcerptWords` (120, boundary inclusive) the scanner emits a
minimize-candidate: a patch that truncates to 120 words plus the marker
`…[truncated]`, written to
`knowledge/quarantine/sensitive-data/minimize-candidates/`, flagged
`neverAutoApply` and `requiresHumanApproval`. If no excerpt text exists to
truncate, the record is rejected instead.

## Actions and outputs

Per-record verdicts: `pass`, `quarantine`, `reject`, `minimize-candidate`,
each with `recordRef`, `detectedClass`, `declaredClass`, `rulesFired`, and
`redactions`. Receipts (one per input set, deterministic per `--now`) go to
`knowledge/receipts/sensitive-data/`; quarantine copies and patch candidates go
to `knowledge/quarantine/sensitive-data/`. Exit code is 1 whenever any record
may not be ingested as-is (any reject or minimize-candidate), 2 on usage/IO
error, 0 only when every record passes. The scanner never writes to canonical
record directories.

## Proof order for operators

1. Run `node scripts/knowledge/test-sensitive-data.mjs --now <fixed>` before
   ingestion; all fixtures must pass and the double run must print one
   identical `DIGEST sensitive-data <hex>` line.
2. Scan every candidate bundle; any reject blocks the whole record.
3. Triage the quarantine queue: classify, add governance metadata, or delete.
4. Apply minimize patches only by hand, with rights review recorded.
5. Re-scan after every remediation; verdicts must reconstruct from receipt to
   rule to governance key.

## Known limitations

Pattern detection is not proof. Secrets with non-standard prefixes, secrets
split across three or more fields or interleaved with separators, and secrets
in records with more than 60 string fields (pairwise scan bound) can evade
detection; rotated/encoded (base64, hex) secrets are not detected. Personal-data
signals are English-biased regular expressions and field-name heuristics; they
under-detect non-English PII and can over-detect email-shaped strings. Word
counting is whitespace-based. The scanner judges only the record in front of
it; a `public` label that contradicts the content is not a detectable
violation unless a secret pattern fires. Detection gaps are compensated by the
quarantine default, human review, and periodic re-scans.
