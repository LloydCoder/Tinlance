# Enterprise CI Gate Verification

This document records that the enterprise CI workflow is intentionally runnable on both pull requests and the default branch, with manual `workflow_dispatch` support for operational verification.

The release gate requires the web, FDE API, AI security regression, container validation, SBOM, static security scan, and dependency-review jobs to succeed before the enterprise gate succeeds.
