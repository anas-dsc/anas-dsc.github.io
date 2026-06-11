---
title: ECG Time Series Classification
description: Deep learning pipeline classifying ECG signals into Normal, AF, Other, and Noisy classes. 77% weighted F1 on 6k+ records.
repo: https://github.com/aimanalhazmi/ECG-Time-Series-Classification
tags: [AI, ML, Deep Learning, Python, PyTorch, Healthcare]
featured: true
order: 2
---

Built a deep learning pipeline to classify ECG signals into Normal, AF, Other, and Noisy classes. Explored 6k+ ECG records, handled class imbalance, and achieved a **77% weighted F1-score** on the validation set.

Used CRNN with STFT preprocessing, class-weighted loss, and data augmentation (noise, cropping, shifting, etc.) to improve generalization. Outperformed classical models and improved minority class detection (AF, Noisy) through augmentation and dropout.
