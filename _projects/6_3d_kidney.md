---
layout: page
title: 3D Kidney Segmentation
description: Automated kidney structure segmentation from medical scans
img: assets/img/3d-kidney-segmentation.png
importance: 6
category: work
category_desc: Machine Learning
tech_stack: PyTorch, 3D Segmentation, CT Images, FC-CNN
github: https://github.com/adhitaazizi/computer-vision-project
---

{% if page.img %}
<div class="project-thumbnail mb-4">
  {% include figure.liquid loading="eager" path=page.img class="img-fluid rounded z-depth-1" %}
</div>
{% endif %}

## Challenges

Manual segmentation of kidney structures from CT/MRI scans is time-intensive for radiologists, prone to human error, and limits the ability to provide quantitative analysis for diagnostic decision-making.

## Solutions

3D convolutional neural networks using U-Net architecture variants with medical imaging libraries to automatically segment kidney structures from volumetric medical scans.

## Key Results

- Dice Score: 0.86
- IoU: 0.84

## Technology

Pytorch, 3D Segmentation, CT Images, FC-CNN

[View on GitHub](https://github.com/adhitaazizi/computer-vision-project)
