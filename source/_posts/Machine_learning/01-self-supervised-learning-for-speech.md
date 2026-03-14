---
layout: posts
title: "01 Self-Supervised Learning for Speech"
date: 2025-01-01 10:00:00
tags:
  - machine-learning
  - self-supervised-learning
  - speech
categories:
  - Machine Learning
---

This is the first post in a three-part series covering the evolution of self-supervised learning (SSL) in speech processing, from foundational concepts through wav2vec to HuBERT.

<!-- more -->

## Why Self-Supervised Learning?

Labeled speech data is expensive. Transcribing audio requires human annotators, and for many languages or domains, large labeled corpora simply do not exist. Meanwhile, **unlabeled** speech is abundant — podcasts, audiobooks, phone calls, and broadcast media produce enormous volumes of raw audio every day.

Self-supervised learning bridges this gap by designing **pretext tasks** that extract supervision signals from the data itself, learning general-purpose representations that transfer to downstream tasks (ASR, speaker verification, emotion recognition, etc.) with minimal labeled data.

## The SSL Framework

A typical SSL pipeline for speech has three stages:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Pre-train    │ ──► │  2. Fine-tune    │ ──► │  3. Evaluate     │
│  (unlabeled)     │     │  (small labeled) │     │  (downstream)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Stage 1 — Pre-training

The model learns representations from **unlabeled audio** by solving a pretext task. No transcriptions or labels are needed.

### Stage 2 — Fine-tuning

A task-specific head (e.g., a CTC decoder for ASR) is added on top of the pre-trained encoder. The full model is fine-tuned on a **small labeled dataset**.

### Stage 3 — Evaluation

The model is evaluated on the target downstream task and compared to supervised baselines.

## Categories of SSL Pretext Tasks

### 1. Generative (Autoregressive)

Predict the next frame given past context, similar to language modeling.

- The model sees frames $x_1, x_2, \ldots, x_t$ and predicts $x_{t+1}$.
- Example: **Autoregressive Predictive Coding (APC)**.

$$
\mathcal{L}_{\text{AR}} = \sum_{t} \| x_{t+k} - f(x_{\leq t}) \|^2
$$

### 2. Contrastive

Learn to distinguish a true future frame from negatives sampled from other positions or utterances.

- The model produces a context vector $c_t$ and must identify the correct future $z_{t+k}$ among distractors.
- Example: **Contrastive Predictive Coding (CPC)**, **wav2vec**.

$$
\mathcal{L}_{\text{contrastive}} = -\log \frac{\exp(\text{sim}(c_t, z_{t+k}))}{\sum_{j} \exp(\text{sim}(c_t, z_j))}
$$

### 3. Masked Prediction

Mask portions of the input and predict the masked content, analogous to BERT's masked language modeling.

- The model sees a partially masked spectrogram or latent sequence and reconstructs the hidden parts.
- Example: **wav2vec 2.0**, **HuBERT**.

### 4. Multi-task / Hybrid

Combine multiple objectives (e.g., contrastive + diversity loss in wav2vec 2.0).

## Why Speech SSL Is Harder Than Text SSL

| Challenge | Description |
|:----------|:------------|
| Continuous signal | Speech is a continuous waveform, not discrete tokens. There is no natural vocabulary. |
| Variable rate | Phonemes vary in duration; there is no fixed alignment between frames and linguistic units. |
| Speaker variability | The same word sounds different across speakers, accents, and recording conditions. |
| Long sequences | A 10-second utterance at 16 kHz is 160,000 samples — far longer than a typical text sentence. |

These challenges motivate the architectural and objective design choices in wav2vec and HuBERT, which we cover in the next two posts.

## Key Takeaways

1. SSL exploits **unlabeled data** to learn representations, reducing dependence on costly transcriptions.
2. The three main pretext task families are **generative**, **contrastive**, and **masked prediction**.
3. Speech presents unique challenges (continuous signal, variable rate, speaker variability) that require specialized model designs.

## What's Next

In [Part 2](/Machine_learning/02-wav2vec-to-wav2vec2/), we trace the evolution from wav2vec to wav2vec 2.0, showing how contrastive learning and quantization combine with masked prediction to produce state-of-the-art speech representations.

## References

- Oord et al., "Representation Learning with Contrastive Predictive Coding," 2018. [arXiv:1807.03748](https://arxiv.org/abs/1807.03748)
- Chung et al., "An Unsupervised Autoregressive Model for Speech Representation Learning," 2019. [arXiv:1904.03240](https://arxiv.org/abs/1904.03240)
- Liu et al., "TERA: Self-Supervised Learning of Transformer Encoder Representation for Speech," 2021. [arXiv:2007.06028](https://arxiv.org/abs/2007.06028)
