// LINEAGE: for each model id, the parent(s) it evolved from and the specific delta added.
// Models with no parents (true originals) are omitted (treated as roots).
const LINEAGE = {
  mlp: [{ id:"perceptron", delta:"swapped the hard threshold for a smooth nonlinearity and stacked layers, so error could backpropagate through depth — fixing the perceptron's inability to learn non-linearly-separable functions like XOR." }],

  lenet: [{ id:"mlp", delta:"replaced full connectivity with convolution + pooling, so weights are shared across spatial positions instead of learned separately per pixel — making image input tractable." }],

  dbn: [{ id:"hopfield", delta:"replaced symmetric energy-based associative memory with stacked, directionally-trained RBMs, enabling unsupervised layer-by-layer pretraining of deep nets before good initialization tricks existed." }],

  alexnet: [{ id:"lenet", delta:"scaled the same conv+pool template far deeper, swapped sigmoid/tanh for ReLU to stop saturation, added dropout, and used GPUs — proving depth+data+compute beats hand-engineered features." }],

  vgg: [{ id:"alexnet", delta:"replaced AlexNet's larger, varied filter sizes with a uniform stack of small 3×3 convolutions, showing that depth alone — with no other architectural cleverness — was a real performance lever." }],

  inception: [{ id:"vgg", delta:"replaced VGG's single filter size per layer with parallel multi-scale filters (1×1/3×3/5×5) in one block, capturing features at several scales at once instead of forcing one scale per layer." }],

  resnet: [{ id:"inception", delta:"added identity skip connections so each layer only learns a residual correction, giving gradients a direct path back through any depth — solved the degradation problem that capped how deep CNNs could practically go." }],

  unet: [{ id:"resnet", delta:"adapted skip connections into an encoder-decoder shape for per-pixel prediction — instead of skipping within a stack for classification, U-Net mirrors entire encoder stages onto decoder stages for segmentation." }],

  seq2seq: [{ id:"lstm", delta:"chained two LSTMs (encoder, decoder) so variable-length input could map to variable-length output, rather than one LSTM producing one fixed-size prediction." }],

  attention: [{ id:"seq2seq", delta:"replaced Seq2Seq's single fixed-length context vector with a dynamically-weighted blend of ALL encoder states, recomputed at every decoding step — removing the fixed-vector bottleneck." }],

  gan: [{ id:"vae", delta:"replaced the VAE's explicit probabilistic likelihood and KL-regularized latent space with an adversarial game between two networks — trading a tractable likelihood for sharper, more realistic samples." }],

  transformer: [
    { id:"attention", delta:"generalized Bahdanau attention from an RNN-decoder add-on into the network's only computation — self-attention lets every token attend to every other token directly, removing recurrence entirely." },
    { id:"resnet", delta:"borrowed residual connections to wrap every attention and feed-forward sub-layer, which is what makes training Transformers stacked dozens of layers deep actually tractable." }
  ],

  bert: [{ id:"transformer", delta:"used only the Transformer's encoder stack and trained it bidirectionally via masked-token prediction, instead of left-to-right generation — built for understanding context, not generating text." }],

  gpt: [{ id:"transformer", delta:"used only the Transformer's decoder stack with causal masking, trained purely on next-token prediction — simpler than BERT's masking scheme, but the same architecture scales into a generator." }],

  gpt23: [{ id:"gpt", delta:"kept the exact same decoder-only architecture and objective, but scaled parameters and training data by orders of magnitude — revealing that few-shot in-context learning emerges from scale alone." }],

  vit: [{ id:"bert", delta:"replaced text tokens with linearly-projected image patches and reused BERT's [CLS]-token convention for classification — applying an unmodified Transformer encoder to vision, no convolutions at all." }],

  diffusion: [{ id:"vae", delta:"replaced the VAE's single-step encode/decode with many small, fixed noise-adding steps and a learned step-by-step reverse process — trading one hard inference problem for many easy ones." }],

  clip: [{ id:"vit", delta:"paired a ViT-style image encoder with a text encoder and trained both jointly via contrastive loss, so images and text share one embedding space — turning a vision model into a vision-LANGUAGE model." }],

  moe: [{ id:"transformer", delta:"replaced each Transformer block's single dense feed-forward layer with many parallel expert layers plus a router that activates only a few per token — decoupling parameter count from per-token compute cost." }],

  swin: [{ id:"vit", delta:"restricted self-attention to small local windows that shift between layers, instead of ViT's full quadratic attention over every patch — reintroducing CNN-like locality and linear cost." }],

  alphafold2: [{ id:"transformer", delta:"split self-attention into two cooperating representations (sequence and residue-pair) that repeatedly cross-update each other, instead of one token stream — built for 3D structure, not language." }],

  rag: [{ id:"bert", delta:"added a retriever that searches an external document store before generation, conditioning outputs on retrieved evidence — moving 'knowledge' out of frozen weights and into a swappable index." }],

  chinchilla: [{ id:"gpt23", delta:"didn't change the architecture at all — measured that GPT-3-era models were oversized relative to their training data, and found the compute-optimal ratio between parameters and tokens." }],

  rlhf: [{ id:"gpt23", delta:"added a reward model trained on human preference rankings, then fine-tuned the base LM via RL to maximize that reward — shifted the objective from likelihood to human-judged helpfulness." }],

  ldm: [{ id:"diffusion", delta:"ran the entire forward/reverse diffusion process inside a VAE's compressed latent space instead of on raw pixels, and added cross-attention to a text encoder — cut compute drastically and added text control." }],

  flamingo: [{ id:"clip", delta:"instead of jointly training vision and text encoders from scratch, froze a pretrained vision encoder and a pretrained LM and grafted new trainable cross-attention layers between them — cheap modality fusion." }],

  sam: [{ id:"vit", delta:"reused a ViT image encoder but added a prompt encoder and lightweight mask decoder, reframing segmentation as a promptable, zero-shot task instead of one fixed to predefined categories." }],

  mamba: [{ id:"transformer", delta:"replaced self-attention's O(n²) pairwise comparison with a selective state-space recurrence whose parameters depend on the input — keeps attention's selectivity benefit at linear, not quadratic, cost." }],

  dpo: [{ id:"rlhf", delta:"algebraically substituted out RLHF's separate reward model, collapsing reward-training and RL fine-tuning into one closed-form supervised loss computed directly on preference pairs." }],

  dit: [
    { id:"ldm", delta:"swapped latent diffusion's U-Net denoising backbone for a plain Transformer operating on patches, inheriting the Transformer's well-understood, smooth scaling behavior." },
    { id:"vit", delta:"borrowed ViT's patchify-and-tokenize approach for images, but conditions via adaptive layer norm instead of a [CLS] token, since the task is denoising, not classification." }
  ],

  deepseek: [{ id:"moe", delta:"made experts finer-grained (more, smaller experts plus always-on shared experts) and added multi-head latent attention, which compresses the KV cache into one small latent vector per token instead of full per-head keys/values." }],

  o1: [{ id:"gpt23", delta:"kept the same decoder-only architecture, but trained via RL to generate extended internal reasoning before answering — added a new scaling axis (inference-time compute) on top of model size and data." }],

  r1: [{ id:"o1", delta:"reproduced extended chain-of-thought reasoning but trained it via RL on automatically verifiable rewards (correct code/math) instead of human-labeled reasoning traces — and showed it can emerge with no supervised reasoning data at all." }],

  interaction: [
    { id:"gpt23", delta:"replaced turn-based generation with continuous 200ms input/output streams processed in parallel, giving the model a native sense of elapsed time instead of only knowing time if it's written into the prompt." },
    { id:"flamingo", delta:"pushed modality fusion further than Flamingo's frozen-encoder grafting — audio and video are minimally pre-processed and co-trained from scratch with the Transformer, no separately pretrained encoder bolted on." }
  ]
};
