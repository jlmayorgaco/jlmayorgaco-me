---
title: "r-biblio-synth"
summary: "Automated literature analysis and bibliometric synthesis tool for research workflows"
year: 2024
status: "published"
tags: ["Research Tool", "Bibliometrics", "Data Analysis", "R"]
stack: ["R", "Data Analysis", "Bibliometrics", "Text Mining"]
featured: false
order: 5
links:
  repo: "https://github.com/jlmayorga/r-biblio-synth"
roadmap:
  completion: 90
  current_phase: "Future"
  phases:
    - label: "Idea"
      status: "completed"
      date: "2023-01"
    - label: "Research"
      status: "completed"
      date: "2023-04"
    - label: "Prototype"
      status: "completed"
      date: "2023-08"
    - label: "Validation"
      status: "completed"
      date: "2024-01"
    - label: "Future"
      status: "active"
      date: "2024-06"
  what_works:
    - "CrossRef API integration"
    - "Topic modeling with LDA"
    - "Citation network visualization"
    - "Export to BibTeX/JSON/CSV"
  limitations:
    - "Slow API rate limiting"
    - "Limited to publicly available metadata"
    - "No full-text analysis"
  next_steps:
    - "Semantic Scholar API integration"
    - "Full-text PDF analysis"
    - "Collaboration features for research groups"
---

## Problem

Literature review is time-consuming:
- Manual paper categorization
- Inconsistent tagging across researchers
- Hard to track research evolution
- No structured knowledge extraction

## Goal

- Reduce friction in research workflows
- Enable structured knowledge extraction
- Automated bibliometric analysis
- Citation network visualization

## Features

- Automated paper metadata extraction from databases
- Topic modeling and clustering
- Citation network analysis
- Research trend identification
- Export to multiple formats (BibTeX, JSON, CSV)

## Technical Details

- Integration with CrossRef, Semantic Scholar APIs
- Text preprocessing and NLP pipeline
- D3.js visualization for citation networks
- Reproducible R scripts with RMarkdown

## Use Cases

- Systematic literature reviews
- Research landscape mapping
- Citation analysis
- Trend identification in specific fields
