---
layout: page
title: Floor Plan Agentic Platform
description: Multi-agent system for automated floor plan generation
img: assets/img/floor-plan-generation.png
importance: 2
category: work
category_desc: Machine Learning
selected: true
tech_stack: Next.js, PyTorch, Huggingface, vLLM, Autogen, AWS
---

{% if page.img %}
<div class="project-thumbnail mb-4">
  {% include figure.liquid loading="eager" path=page.img class="img-fluid rounded z-depth-1" %}
</div>
{% endif %}

## Challenges

- Manual floor plan design takes hours or days for architects
- Manual inspection prone to human error and oversight

## Solutions

- Multi-agent system for floor plan generation
- LLM based layouts compliance against requirements with detailed feedback
- Direct output to CAD format for ease integration

## Key Results

- Floor Plan Generation IoU: 88.24%
- Passed all given scenarios during end-to-end test for floor plan generation agents
- Compliance Accuracy on test data: 94.65%

## Technology

Next.js, Pytorch, Huggingface, vLLM, Autogen, Amazon Web Service

## Business Impact

Reduced design cycle time from days to minutes, enabling to scale operations and take on more construction projects simultaneously • Automated compliance validation minimizes costly rework and accelerates time-to-market for boarding house and co-living developments.
