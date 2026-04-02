---
title: "r-biblio-synth Update - Semantic Scholar Integration"
description: "Added Semantic Scholar API to the bibliography tool. Now with citation context and paper recommendations."
date: 2026-03-10
author: "Jorge Mayorga"
category: "Tools"
tags: ["bibliography", "research-tool", "latex", "academic-writing"]
featured: false
---

Added Semantic Scholar integration to r-biblio-synth. Here's what's new:

## New Features

**Citation Context**
```r
papers <- get_papers("distributed control", limit = 50)
papers_with_context <- add_citation_context(papers)
```

Extracts the sentence context where each citation appears. Useful for understanding *how* a paper is being cited.

**Paper Recommendations**
Based on citation graph proximity and topic similarity. Not perfect but useful for discovery.

**Improved BibTeX Export**
- Handles special characters better
- Preserves CrossRef metadata quality indicators
- Auto-fixes common formatting issues

## Example Output

```bibtex@article{DBLP:conf/cdc/ChenSP21,
  author    = {Chen and Smith and Park},
  title     = {Distributed Consensus with Event-Triggered Communication},
  booktitle = {CDC},
  year      = {2021},
  doi       = {10.1109/CDC45484.2021.9543},
  citation_context = {"...achieve distributed consensus..."}
}
```

## Usage

```r
remotes::install_github("jlmayorga/r-biblio-synth")
library(bibliosynth)

# Find papers on graph-LQR
results <- search_topic("graph theoretic control LQR")
export_bib(results, "graph-lqr.bib")
```

## Coming Soon

- Citation network visualization (D3.js)
- Systematic review workflow
- Integration with Zotero
