---
layout: posts
title: "02 From wav2vec to wav2vec 2.0"
date: 2025-01-02 10:00:00
tags:
  - machine-learning
  - wav2vec
  - self-supervised-learning
  - speech
categories:
  - Machine Learning
---

Building on the SSL foundations from [Part 1](/Machine_learning/01-self-supervised-learning-for-speech/), this post walks through the wav2vec family — from the original wav2vec to vq-wav2vec to wav2vec 2.0 — showing how each iteration improved speech representation learning.

<!-- more -->

## 1. wav2vec (2019)

**Paper:** Schneider et al., "wav2vec: Unsupervised Pre-training for Speech Recognition," 2019. [arXiv:1904.05862](https://arxiv.org/abs/1904.05862)

### Architecture

wav2vec operates entirely on raw waveform input. It has two components:

```
Raw waveform ──► [ Encoder f ] ──► z_i ──► [ Context network g ] ──► c_i
                  (5-layer CNN)              (9-layer CNN)
```

- **Encoder network $f$**: A 5-layer causal CNN that converts raw audio into latent representations $z_i$ at a stride of ~10ms per frame.
- **Context network $g$**: A 9-layer causal CNN that aggregates encoder outputs into context vectors $c_i$, capturing ~210ms of receptive field.

### Training Objective

wav2vec uses a **contrastive loss** inspired by CPC. Given context $c_i$, the model must identify the true future encoding $z_{i+k}$ among a set of negatives $\tilde{z}$:

$$
\mathcal{L} = -\sum_{k=1}^{K} \left[ \log \sigma(z_{i+k}^\top h_k(c_i)) + \sum_{j=1}^{N} \log \sigma(-\tilde{z}_j^\top h_k(c_i)) \right]
$$

where $h_k$ is a step-specific affine transformation and $\sigma$ is the sigmoid function. Negatives are sampled from the same utterance.

### Results

- Pre-trained representations + simple character-level model achieved **WER 2.43%** on WSJ, competitive with strong supervised baselines.
- Demonstrated that unsupervised pre-training from raw audio is viable.

### Limitations

- Encoder output $z_i$ is a continuous vector — the representation space is unconstrained.
- Context network is a CNN with limited receptive field; no global attention.

---

## 2. vq-wav2vec (2020)

**Paper:** Baevski et al., "vq-wav2vec: Self-Supervised Learning of Discrete Speech Representations," 2020. [arXiv:1910.05453](https://arxiv.org/abs/1910.05453)

### Key Idea

Insert a **vector quantization (VQ)** module between the encoder and context network to discretize the latent representations:

```
Raw waveform ──► [ Encoder f ] ──► z_i ──► [ VQ ] ──► q_i ──► [ Context g ] ──► c_i
```

This produces a discrete token sequence $q_1, q_2, \ldots$, enabling the use of NLP techniques (like BERT) on speech.

### Quantization Methods

Two approaches were explored:

| Method | Description |
|:-------|:------------|
| **Gumbel-Softmax** | Differentiable approximation to argmax over codebook entries. Enables end-to-end training. |
| **K-means VQ** | Hard assignment with straight-through estimator for gradients. |

Gumbel-Softmax with multiple codebook groups (product quantization) performed best.

### BERT on Speech

After pre-training vq-wav2vec, the discrete tokens can be fed into a standard **BERT** model for masked language modeling on speech:

1. Pre-train vq-wav2vec to get discrete tokens.
2. Train BERT on the token sequences (mask 15% of tokens, predict the masked ones).
3. Fine-tune for ASR.

### Results

- vq-wav2vec + BERT: **WER 2.34%** on WSJ (nov92), improving over wav2vec.
- Showed that discretization enables NLP-style pre-training on speech.

### Limitations

- Two-stage pipeline (vq-wav2vec then BERT) — not end-to-end.
- Quantization quality depends on codebook size and training dynamics.

---

## 3. wav2vec 2.0 (2020)

**Paper:** Baevski et al., "wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations," 2020. [arXiv:2006.11477](https://arxiv.org/abs/2006.11477)

wav2vec 2.0 unifies the best ideas from wav2vec and vq-wav2vec into a single end-to-end framework.

### Architecture

```
                                    ┌──────────────────┐
                                    │  Quantization     │
                                    │  Module           │
                                    │  z ──► q          │
                                    └────────┬─────────┘
                                             │ (targets)
                                             ▼
Raw waveform ──► [ CNN Encoder f ] ──► z ──► ┐
                                             │ mask
                                             ▼
                                   [ Transformer g ] ──► c
                                             │
                                             ▼
                                   Contrastive Loss: c vs q
```

**Three components:**

1. **Feature encoder $f$**: 7-layer temporal CNN. Converts 16kHz raw audio into latent vectors $z$ at 20ms stride (49 frames/sec).

2. **Quantization module**: Product quantization with Gumbel-Softmax. Discretizes $z$ into $q$ using $G$ codebook groups, each with $V$ entries.
   - With $G=2$ groups and $V=320$ entries: $320^2 = 102{,}400$ possible codes.
   - The quantized $q$ serves as the **target** for the masked prediction task.

3. **Context network $g$**: A Transformer encoder. Takes the (partially masked) encoder output and produces context vectors $c$.

### Masking Strategy

- Randomly sample starting indices, then mask **consecutive spans** of 10 frames (~200ms).
- ~49% of frames are masked on average.
- The Transformer sees the unmasked frames plus mask tokens and must reconstruct context at masked positions.

### Training Objective

The loss has two terms:

$$
\mathcal{L} = \mathcal{L}_{\text{contrastive}} + \alpha \cdot \mathcal{L}_{\text{diversity}}
$$

#### Contrastive Loss

At each masked position $t$, the model must identify the true quantized target $q_t$ among $K$ distractors sampled from other masked positions in the same utterance:

$$
\mathcal{L}_{\text{contrastive}} = -\log \frac{\exp(\text{sim}(c_t, q_t) / \kappa)}{\sum_{j \in \{t\} \cup \text{neg}} \exp(\text{sim}(c_t, q_j) / \kappa)}
$$

where $\text{sim}(a, b) = a^\top b / \|a\| \|b\|$ (cosine similarity) and $\kappa$ is a temperature.

#### Diversity Loss

Encourages uniform usage of codebook entries (prevents codebook collapse):

$$
\mathcal{L}_{\text{diversity}} = -\frac{1}{GV} \sum_{g=1}^{G} \sum_{v=1}^{V} \bar{p}_{g,v} \log \bar{p}_{g,v}
$$

where $\bar{p}_{g,v}$ is the average probability of choosing entry $v$ in group $g$ across a batch (maximizing entropy = uniform usage).

### Model Configurations

| Model | Transformer Layers | Hidden Dim | Attention Heads | Parameters |
|:------|:-------------------|:-----------|:----------------|:-----------|
| BASE  | 12                 | 768        | 8               | 95M        |
| LARGE | 24                 | 1024       | 16              | 317M       |

### Fine-tuning for ASR

- Add a linear projection on top of the Transformer output.
- Train with **CTC loss** (Connectionist Temporal Classification).
- Optionally decode with a language model (4-gram or Transformer LM).

### Key Results (LibriSpeech)

| Setting | Labeled Data | WER (test-clean) | WER (test-other) |
|:--------|:-------------|:-----------------|:-----------------|
| LARGE + LM | 960h | 1.8 | 3.3 |
| LARGE + LM | 10min | 4.8 | 8.2 |
| LARGE + LM | 1h | 2.6 | 5.2 |

The 10-minute result was groundbreaking: near-usable ASR from just **10 minutes** of labeled data.

### Why It Works

1. **End-to-end**: No separate quantization pre-training step.
2. **Masked prediction**: Forces the Transformer to learn contextual representations (like BERT for speech).
3. **Contrastive + quantization**: The model must distinguish the correct discrete target, creating a well-structured latent space.
4. **Diversity loss**: Prevents mode collapse in the codebook.

---

## Evolution Summary

```
wav2vec (2019)         vq-wav2vec (2020)       wav2vec 2.0 (2020)
──────────────         ─────────────────       ──────────────────
CNN encoder            CNN encoder             CNN encoder
CNN context            + VQ layer              + VQ (Gumbel-Softmax)
Contrastive loss       CNN context             Transformer context
                       Contrastive loss        Masked contrastive loss
                       → then BERT (2-stage)   + Diversity loss
                                               (end-to-end)
```

## What's Next

wav2vec 2.0 relies on contrastive learning with quantized targets, but the targets are learned jointly with the model — this creates a bootstrapping problem. In [Part 3](/Machine_learning/03-hubert-hidden-unit-bert/), we examine **HuBERT**, which takes a different approach: iteratively discovering discrete targets via offline clustering, then training a masked prediction model against those targets.

## References

- Schneider et al., "wav2vec: Unsupervised Pre-training for Speech Recognition," 2019. [arXiv:1904.05862](https://arxiv.org/abs/1904.05862)
- Baevski et al., "vq-wav2vec: Self-Supervised Learning of Discrete Speech Representations," 2020. [arXiv:1910.05453](https://arxiv.org/abs/1910.05453)
- Baevski et al., "wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations," 2020. [arXiv:2006.11477](https://arxiv.org/abs/2006.11477)
