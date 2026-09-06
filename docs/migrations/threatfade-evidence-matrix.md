# ThreatFade Historical Evidence Reconciliation

Audit date: 2026-09-06

## Evidence sources

1. Live legacy homepage: `https://tinlance.com/` — currently exposes the 490,847-packet, z-score 14.76 and 0% false-positive claims.
2. Indexed Tinlance research article: `https://tinlance.com/blog?slug=threatfade-quic-c2-detection` — describes a test PCAP of about 490,000 packets of real Merlin QUIC C2 traffic and a z-score of 14.76.
3. Public technical write-up: https://dev.to/nwachukwu_chinaemerem_f01/how-i-detected-merlin-quic-c2-traffic-using-entropy-and-z-scores-490k-packets-0-false-positives-mki — independently visible article states the 490K packet / 0% false-positive result and explicitly says the false-positive challenge is not claimed solved for production enterprise networks.
4. Current ThreatFade repository: `https://github.com/LloydCoder/tinlance-threatfade` — current README documents entropy/statistical deviation, z-score anomaly detection, C2/LOTL/GNSS scenarios, deterministic benchmarks, and an evidence-first research/validation posture, but does not contain the exact 490,847 / 14.76 benchmark result.
5. Public open-source contribution evidence: Semgrep PR #3719 and linked references to Nuclei #14253 and TruffleHog #4588.

## Claim matrix

| Claim | Historical source/context | Scope | Current technical support | Current web representation | Recommended wording | Status |
|---|---|---|---|---|---|---|
| 490,847 packets | Live legacy homepage / historical MVP evidence | Specific tested traffic population | Current repo supports PCAP ingestion and deterministic benchmark infrastructure, but exact 490,847 run is not in README/code evidence inspected | Homepage currently says 490,847; current canonical ThreatFade/research pages should frame it as historical | “Early MVP validation against 490,847 packets of real Merlin QUIC C2 traffic.” | HISTORICAL VERIFIED / NEEDS CONTEXT |
| Real Merlin QUIC C2 traffic | Legacy homepage + indexed article + public write-up | Specific historical test PCAP | Current repo explicitly supports PCAP analysis and C2 detection | Preserve as research evidence | “Validated in an early MVP experiment using real Merlin QUIC C2 traffic.” | HISTORICAL VERIFIED |
| z-score 14.76 | Legacy homepage + indexed article + public write-up | Specific historical experiment | Current repo implements z-score anomaly detection but exact 14.76 result is not in current repo evidence | Preserve with historical scope | “The early Merlin experiment produced a z-score of 14.76.” | HISTORICAL VERIFIED / NEEDS CONTEXT |
| 0% false positives | Legacy homepage + public write-up | Tested population only | Current repo contains validation/benchmark infrastructure but no inspected current evidence proving the historical 0% result universally | Preserve only with population scope | “0% false positives across the tested MVP populations.” | HISTORICAL VERIFIED / NEEDS CONTEXT |
| Behavioural detection rather than signatures | Legacy homepage/article + current repo README | Detection methodology | Current repo supports entropy, statistical deviation, heuristic detection and confidence scoring | Safe as a methodology statement | “ThreatFade uses behavioural/statistical signals alongside detection rules; it is not limited to signatures.” | CURRENT VERIFIED |
| C2 quieting detection | Legacy homepage/article + current repo README | Product capability/research | Current repo lists C2 fade scenarios and detection rules | Safe as capability with validation scope | “ThreatFade includes C2 quieting/fade detection research and implementation.” | CURRENT VERIFIED |
| LOTL fade detection | Legacy homepage + current repo README | Product capability | Current repo documents LOTL gradual fade scenario and rule | Safe with current research/product scope | “ThreatFade includes LOTL fade detection.” | CURRENT VERIFIED |
| GNSS interference detection | Legacy homepage + current repo README | Product capability | Current repo documents GNSS detection and correlation | Safe as current capability | “ThreatFade includes GNSS disruption detection and correlation.” | CURRENT VERIFIED |
| 5 merged OSS PRs | Legacy homepage + public GitHub evidence | Historical engineering contribution | Public contribution evidence supports the contribution history; exact current star counts are time-sensitive | Preserve as contribution history | “Tinlance has made merged security contributions to public OSS projects including Nuclei, TruffleHog, Semgrep, Gitleaks and Slither.” | HISTORICAL VERIFIED |
| 65K+ combined GitHub stars | Legacy homepage | Historical point-in-time metric | Star counts change; current audit does not freeze exact values | Avoid hard-coding unless dated | “Historical snapshot reported 65K+ combined stars across contributed tools.” | HISTORICAL VERIFIED / TIME-SENSITIVE |

## Required presentation rule

The legacy homepage currently contains wording such as “validated in production” beside the 490K/0% figures. The migration must **not** carry that wording into the canonical site without qualification. The stronger and safer representation is:

> **Early MVP validation:** 490,847 packets of real Merlin QUIC C2 traffic; z-score 14.76; 0% false positives across the tested MVP populations.

This preserves the evidence while preventing a scoped experiment from being interpreted as a universal current production guarantee.

## Current repository reconciliation

The current ThreatFade repository explicitly describes itself as evidence-first and states that source code alone does not prove independent detection validation, SOC 2/ISO certification, third-party penetration testing, contractual SLAs, or customer-scale performance. It also labels the ML track experimental and requires real-world validation before production claims. That posture is consistent with contextualizing the historical MVP figures rather than deleting them.
