---
layout: posts
title: "03 HuBERT — Hidden-Unit BERT"
date: 2025-01-03 10:00:00
tags:
  - machine-learning
  - hubert
  - self-supervised-learning
  - speech
categories:
  - Machine Learning
---

In [Part 2](/Machine_learning/02-wav2vec-to-wav2vec2/) we saw how wav2vec 2.0 learns speech representations via contrastive learning with jointly-learned quantized targets. HuBERT takes a fundamentally different approach: it discovers discrete targets **offline** via clustering, then trains a BERT-style masked prediction model against those targets. This post explains how and why this works.

<!-- more -->

## The Problem with wav2vec 2.0's Targets

In wav2vec 2.0, the quantization module and the Transformer are trained simultaneously. This creates a chicken-and-egg problem:

- Good targets require a good encoder.
- A good encoder requires good targets.

The contrastive loss and diversity regularization mitigate this, but the targets are still noisy, especially early in training. HuBERT sidesteps this entirely.

## HuBERT Overview

**Paper:** Hsu et al., "HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units," 2021. [arXiv:2106.07447](https://arxiv.org/abs/2106.07447)

### Core Idea

1. **Discover** discrete pseudo-labels by clustering acoustic features offline.
2. **Train** a Transformer to predict the pseudo-labels at masked positions.
3. **Iterate**: use the trained model's intermediate representations to generate better clusters, then re-train.

```
┌──────────────────────────────────────────────────┐
│                  HuBERT Pipeline                  │
│                                                   │
│  Iteration 0:                                     │
│    MFCC features ──► k-means ──► pseudo-labels    │
│    Train Transformer with masked prediction       │
│                                                   │
│  Iteration 1:                                     │
│    Transformer layer N features ──► k-means       │
│    ──► better pseudo-labels                       │
│    Re-train Transformer                           │
│                                                   │
│  Iteration 2 (optional):                          │
│    Repeat with even better features               │
└──────────────────────────────────────────────────┘
```

## Architecture

HuBERT's model architecture is identical to wav2vec 2.0:

```
Raw waveform ──► [ CNN Feature Encoder ] ──► [ Transformer Encoder ] ──► output
                  7-layer CNN, stride 20ms     12 or 24 layers
```

The key difference is **not the architecture but the training objective and target generation**.

### Model Configurations

| Model | Layers | Hidden | Heads | Params |
|:------|:-------|:-------|:------|:-------|
| BASE  | 12     | 768    | 8     | 90M    |
| LARGE | 24     | 1024   | 16    | 300M   |
| X-LARGE | 48   | 1280   | 16    | 1B     |

## Target Generation: Offline Clustering

### Iteration 0 — Starting from Scratch

Since no pre-trained model exists yet, the first round uses simple acoustic features:

1. Extract **39-dimensional MFCC** features from the training audio.
2. Run **k-means** clustering (e.g., $k=100$) on the MFCC features.
3. Assign each frame a cluster index $\rightarrow$ pseudo-label $z_t \in \{1, 2, \ldots, k\}$.

These labels are noisy — MFCCs capture spectral shape but not higher-level structure. That's fine. HuBERT is designed to work with imperfect targets.

### Iteration 1+ — Refinement

After training a HuBERT model on iteration-0 labels:

1. Extract intermediate representations from a specific Transformer **layer** (e.g., layer 6 for BASE).
2. Run k-means again (e.g., $k=500$) on these learned features.
3. Generate new, higher-quality pseudo-labels.
4. Re-train the model from scratch with the new labels.

Each iteration improves label quality because the model's representations capture increasingly abstract linguistic information.

## Training Objective

### Masked Prediction with Cross-Entropy

Given input frames, HuBERT:

1. **Masks** spans of the CNN encoder output (same strategy as wav2vec 2.0: random start points, 10-frame spans, ~49% masked).
2. Feeds the masked sequence through the Transformer.
3. At each **masked** position $t$, predicts the pseudo-label $z_t$ via a projection + softmax.

$$
\mathcal{L} = -\sum_{t \in \mathcal{M}} \log p(z_t \mid \tilde{X})
$$

where $\mathcal{M}$ is the set of masked indices and $\tilde{X}$ is the masked input.

This is a standard **cross-entropy classification** loss — much simpler than wav2vec 2.0's contrastive loss with negative sampling.

### Key Design Choice: Loss Only on Masked Positions

HuBERT computes loss **only at masked positions**. This forces the model to:

- Build contextual representations from unmasked frames.
- Infer the content of masked regions using surrounding context.
- Learn acoustic and linguistic structure, not just local spectral patterns.

The authors also experimented with including unmasked positions in the loss ($\alpha \cdot \mathcal{L}_{\text{unmasked}} + \mathcal{L}_{\text{masked}}$) and found a small $\alpha$ helps early convergence but masked-only loss performs best overall.

## Why Noisy Labels Work

This is HuBERT's most surprising insight. The pseudo-labels from k-means on MFCCs are clearly imperfect — they conflate speaker identity, channel effects, and phonetic content. Yet the model learns excellent representations. Why?

### The Consistency Argument

The labels don't need to be phonetically correct. They only need to be **consistent**: similar sounds should get similar labels. K-means on MFCCs achieves this approximately — acoustically similar frames land in the same cluster.

The **masked prediction** task then forces the model to discover the underlying structure:

- If the model sees "The cat sat on the ___" (acoustically), it must predict what cluster the masked word belongs to.
- Even if the clusters don't perfectly correspond to phonemes, the model must learn syntax, semantics, and phonotactics to make good predictions.
- The model's representations end up **better than the labels** — they capture information the labels miss.

### Analogy to DeepCluster (Vision)

This is similar to DeepCluster (Caron et al., 2018) in computer vision:

1. Cluster image features.
2. Train a CNN to predict cluster assignments.
3. The CNN learns better features than the clusters.
4. Re-cluster and repeat.

HuBERT applies this principle to speech with the added power of masked prediction.

## Comparison: wav2vec 2.0 vs HuBERT

| Aspect | wav2vec 2.0 | HuBERT |
|:-------|:------------|:-------|
| **Target generation** | Online (joint quantization) | Offline (k-means clustering) |
| **Loss function** | Contrastive (InfoNCE) | Cross-entropy classification |
| **Negative sampling** | Required (distractors) | Not needed |
| **Diversity loss** | Required (prevent codebook collapse) | Not needed (fixed targets) |
| **Iterative refinement** | No | Yes (re-cluster with learned features) |
| **Architecture** | CNN encoder + Transformer | CNN encoder + Transformer (same) |
| **Simplicity** | More complex (contrastive + VQ + diversity) | Simpler (cross-entropy on clusters) |

## Results

### LibriSpeech ASR (WER %)

| Model | Labeled Data | test-clean | test-other |
|:------|:-------------|:-----------|:-----------|
| wav2vec 2.0 LARGE | 960h | 1.8 | 3.3 |
| HuBERT LARGE | 960h | 1.5 | 2.8 |
| HuBERT X-LARGE | 960h | 1.5 | 2.6 |
| wav2vec 2.0 LARGE | 10min | 4.8 | 8.2 |
| HuBERT LARGE | 10min | 3.4 | 6.0 |

HuBERT consistently outperforms wav2vec 2.0, especially in low-resource settings.

### SUPERB Benchmark

HuBERT also achieves strong results across diverse tasks in the [SUPERB benchmark](https://superbbenchmark.org/):

- Phoneme recognition
- Speaker identification / verification
- Emotion recognition
- Intent classification
- Slot filling

The representations capture both **content** (what is said) and **speaker** (who is speaking) information.

## Practical Guide: Using HuBERT

### With Hugging Face Transformers

```python
from transformers import HubertModel, Wav2Vec2Processor
import torch
import torchaudio

# Load pre-trained model
processor = Wav2Vec2Processor.from_pretrained("facebook/hubert-large-ls960-ft")
model = HubertModel.from_pretrained("facebook/hubert-large-ls960")

# Load audio
waveform, sr = torchaudio.load("audio.wav")
if sr != 16000:
    waveform = torchaudio.transforms.Resample(sr, 16000)(waveform)

# Extract features
inputs = processor(waveform.squeeze(), sampling_rate=16000, return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)

# Hidden states from each layer
hidden_states = outputs.last_hidden_state  # (batch, time, 1024)
```

### Fine-tuning for ASR

```python
from transformers import HubertForCTC, Wav2Vec2CTCTokenizer

model = HubertForCTC.from_pretrained("facebook/hubert-large-ls960-ft")
# This model is already fine-tuned for ASR with CTC
# For custom fine-tuning, use HubertForCTC.from_pretrained("facebook/hubert-large-ls960")
# and add your own CTC head
```

### Available Checkpoints

| Checkpoint | Pre-training Data | Fine-tuned |
|:-----------|:-----------------|:-----------|
| `facebook/hubert-base-ls960` | LibriSpeech 960h | No |
| `facebook/hubert-large-ls960-ft` | LibriSpeech 960h | Yes (ASR) |
| `facebook/hubert-xlarge-ls960-ft` | Libri-Light 60kh | Yes (ASR) |

## Series Summary

Across these three posts, we traced the evolution:

```
SSL Foundations     wav2vec Family          HuBERT
──────────────     ──────────────          ──────
Pretext tasks  ──► Contrastive on     ──► Offline clustering +
for speech         raw waveforms          masked prediction
                   + quantization          + iterative refinement
                   + Transformer
```

Key progression:
1. **wav2vec**: Contrastive learning on raw audio works.
2. **vq-wav2vec**: Discretization enables BERT-style training on speech.
3. **wav2vec 2.0**: End-to-end masked contrastive learning with quantization.
4. **HuBERT**: Simpler masked prediction with offline-discovered targets, iteratively refined.

The field continues to evolve with models like **WavLM** (adding denoising), **data2vec** (predicting latent representations directly), and **BEST-RQ** (random-projection quantization), but wav2vec 2.0 and HuBERT remain foundational.

## References

- Hsu et al., "HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units," 2021. [arXiv:2106.07447](https://arxiv.org/abs/2106.07447)
- Baevski et al., "wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations," 2020. [arXiv:2006.11477](https://arxiv.org/abs/2006.11477)
- Caron et al., "Deep Clustering for Unsupervised Learning of Visual Features," 2018. [arXiv:1807.05520](https://arxiv.org/abs/1807.05520)
- Yang et al., "SUPERB: Speech processing Universal PERformance Benchmark," 2021. [arXiv:2105.01051](https://arxiv.org/abs/2105.01051)
