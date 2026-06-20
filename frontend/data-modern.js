// MODERN & DISTINCT: the 16 genuinely-new mechanisms from 2021 onward
const MODERN = [
{
  id:"swin", paper:{title:"Swin Transformer: Hierarchical Vision Transformer using Shifted Windows", author:"Liu et al., 2021", url:"https://arxiv.org/abs/2103.14030"}, family:"vision", year:"2021", name:"Swin Transformer",
  concept:"A Vision Transformer that computes self-attention only within small local windows (not the whole image), then shifts the window grid between layers so information eventually flows across window boundaries — recovering CNN-like locality and multi-scale structure inside an attention-based model.",
  mechanism:[
    "Self-attention restricted to non-overlapping M×M windows: cost is $O(M^2 \\cdot N)$ instead of ViT's full $O(N^2)$ — linear in image size rather than quadratic",
    "Alternating layers shift the window partition by (M/2, M/2) pixels, so windows in consecutive layers overlap differently, letting information cross what was a hard window boundary in the previous layer",
    "Patches are merged (2×2 neighboring patches concatenated and projected) at each stage, building a hierarchical, multi-resolution feature pyramid — directly analogous to a CNN's downsampling stages"
  ],
  diagram:"swin",
  significance:"Made Transformers practical for dense vision tasks (detection, segmentation) where ViT's quadratic cost was prohibitive at high resolution, by reintroducing the locality and hierarchy that pure ViT had thrown away."
},
{
  id:"alphafold2", paper:{title:"Highly accurate protein structure prediction with AlphaFold", author:"Jumper et al., 2021", url:"https://www.nature.com/articles/s41586-021-03819-2"}, family:"vision", year:"2021", name:"AlphaFold 2",
  concept:"Predicts 3D protein structure from amino acid sequence by jointly reasoning over two representations at once — a per-residue sequence representation and a per-residue-pair representation — and repeatedly exchanging information between them in a module called the Evoformer.",
  mechanism:[
    "Two parallel representations updated jointly: a sequence representation (one row per residue) and a pair representation (one entry per residue-pair, encoding relative geometry)",
    "Evoformer blocks alternate self-attention within each representation with explicit cross-updates: pair information biases sequence attention, and sequence info updates the pair representation — geometric and evolutionary signal reinforce each other",
    "A structure module then directly outputs 3D atomic coordinates using invariant point attention — attention that respects rotational/translational symmetry of 3D space"
  ],
  diagram:"alphafold",
  significance:"Solved a 50-year-old grand challenge in biology (protein structure prediction) to near-experimental accuracy, and demonstrated that attention-based architectures generalize far beyond language and images into structured scientific domains."
},
{
  id:"rag", paper:{title:"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", author:"Lewis et al., 2020", url:"https://arxiv.org/abs/2005.11401"}, family:"efficiency", year:"2020–2021", name:"Retrieval-Augmented Generation (RAG)",
  concept:"Couples a generative language model with a non-parametric retriever: before generating, the system searches an external document store for relevant passages and conditions generation on them — grounding outputs in retrievable evidence rather than relying solely on what's memorized in the weights.",
  mechanism:[
    "Retriever encodes the query and all documents into a shared vector space, then retrieves the top-k documents by similarity: $\\text{sim}(q,d) = E_q(q)^T E_d(d)$, typically via approximate nearest-neighbor search over a vector index",
    "Generator conditions on both the original query and the retrieved passages: $P(y|x) = \\sum_{d} P(d|x)\\, P(y|x,d)$ — retrieval and generation can be trained end-to-end, with the retriever's choices treated as a latent variable",
    "Because the knowledge store is external and swappable, updating the model's 'knowledge' means updating the document index, not retraining weights"
  ],
  diagram:"rag",
  significance:"Decoupled 'what a model knows' from 'what's baked into its weights' — the architectural basis for every system that needs current, citable, or proprietary information without full retraining, including most production enterprise LLM deployments today."
},
{
  id:"chinchilla", paper:{title:"Training Compute-Optimal Large Language Models", author:"Hoffmann et al., 2022", url:"https://arxiv.org/abs/2203.15556"}, family:"efficiency", year:"2022", name:"Chinchilla Scaling Laws",
  concept:"Not a new architecture but a new training paradigm: for a fixed compute budget, there's an optimal split between model size and training-data size — and most large models before this were oversized and undertrained relative to that optimum.",
  mechanism:[
    "Empirical loss law: $L(N, D) \\approx E + \\frac{A}{N^\\alpha} + \\frac{B}{D^\\beta}$, where N = parameters, D = training tokens, fit across hundreds of training runs at varying scale",
    "Compute-optimal frontier: for fixed compute C ≈ 6ND (forward+backward FLOPs), the loss-minimizing (N, D) pair scales N and D in roughly equal proportion as compute grows — earlier models had scaled N much faster than D",
    "Chinchilla (70B params, more data) outperformed Gopher (280B params, less data) at the same compute budget — empirical proof the field had been allocating compute wrong"
  ],
  diagram:"scaling",
  significance:"Redirected the entire field's scaling strategy from 'bigger model' to 'right-sized model, more data' — this single result reshaped how every major lab since has allocated training compute."
},
{
  id:"rlhf", paper:{title:"Training language models to follow instructions with human feedback", author:"Ouyang et al., 2022", url:"https://arxiv.org/abs/2203.02155"}, family:"efficiency", year:"2022", name:"InstructGPT / RLHF",
  concept:"Adds a training stage after pretraining that optimizes the model against human preferences rather than just next-token likelihood: a separate reward model learns to score outputs the way human raters would, and the language model is then fine-tuned via reinforcement learning to maximize that reward.",
  mechanism:[
    "Reward model is trained on human-ranked pairs of model outputs: $\\mathcal{L}_{RM} = -\\log \\sigma(r_\\theta(x,y_w) - r_\\theta(x,y_l))$ where $y_w$ is the preferred output",
    "Policy (the LLM) is fine-tuned via PPO to maximize the learned reward, with a KL penalty against the original pretrained model to prevent it drifting too far and degenerating: $\\text{objective} = \\mathbb{E}[r_\\theta(x,y)] - \\beta \\cdot D_{KL}(\\pi_\\theta \\| \\pi_{ref})$",
    "This is a training procedure, not an architectural change — the underlying network is the same Transformer decoder, just optimized against a different objective in a later stage"
  ],
  diagram:"rlhf",
  significance:"This is the mechanism that turned raw next-token-predictors into the helpful, instruction-following assistants behind ChatGPT, Claude, and every consumer chat LLM — arguably as consequential to the products people use as any architecture change."
},
{
  id:"ldm", paper:{title:"High-Resolution Image Synthesis with Latent Diffusion Models", author:"Rombach et al., 2022", url:"https://arxiv.org/abs/2112.10752"}, family:"generative", year:"2022", name:"Latent Diffusion (Stable Diffusion)",
  concept:"Runs the entire diffusion noising/denoising process inside a compressed latent space produced by a VAE encoder, instead of directly on full-resolution pixels — cutting the compute and memory cost of diffusion by roughly the compression factor, while a VAE decoder reconstructs final pixels.",
  mechanism:[
    "A pretrained VAE encoder compresses an image to a much smaller latent: $z = E(x)$, typically 8x downsampled per spatial dimension, so diffusion operates on a far smaller tensor",
    "Diffusion (forward noising + learned reverse denoising, as in DDPM) runs entirely on z, not x — the denoising network never sees full-resolution pixels during training",
    "Conditioning (e.g. a text prompt from a CLIP-style text encoder) is injected via cross-attention layers inside the denoising network, letting text steer which parts of the image get generated where"
  ],
  diagram:"ldm",
  significance:"Made high-resolution diffusion image generation feasible on consumer GPUs rather than requiring datacenter-scale compute — directly responsible for the explosion of accessible, open text-to-image models from 2022 onward."
},
{
  id:"flamingo", paper:{title:"Flamingo: a Visual Language Model for Few-Shot Learning", author:"Alayrac et al., 2022", url:"https://arxiv.org/abs/2204.14198"}, family:"multimodal", year:"2022", name:"Flamingo",
  concept:"Fuses a frozen pretrained vision model and a frozen pretrained language model by inserting new, trainable cross-attention layers between them — the language model can 'look at' visual features at generation time without retraining either of the large frozen backbones.",
  mechanism:[
    "A Perceiver Resampler compresses a variable number of vision-encoder features into a small fixed number of visual tokens, regardless of image/video resolution or length",
    "Gated cross-attention layers are interleaved between the LM's existing (frozen) layers; each new layer attends from text tokens to the resampled visual tokens, with a learned gate controlling how much visual influence flows in: $y = x + \\tanh(\\alpha) \\cdot \\text{CrossAttn}(x, \\text{visual tokens})$",
    "Only the newly inserted cross-attention layers and resampler are trained — the vision encoder and language model weights stay frozen, preserving their pretrained capabilities"
  ],
  diagram:"flamingo",
  significance:"Showed multimodal fusion doesn't require training a vision-language model from scratch — you can graft modalities onto a strong frozen LM cheaply, a pattern many later efficient multimodal systems reused."
},
{
  id:"sam", paper:{title:"Segment Anything", author:"Kirillov et al., 2023", url:"https://arxiv.org/abs/2304.02643"}, family:"vision", year:"2023", name:"Segment Anything (SAM)",
  concept:"A segmentation model designed around prompts rather than fixed categories: given an image plus a prompt (a point, a box, or rough mask), it outputs a precise segmentation mask — generalizing to objects and categories it was never explicitly trained to name.",
  mechanism:[
    "Image encoder (a ViT) runs once per image, producing an embedding that's reused for every subsequent prompt — expensive encoding happens once, cheap prompt-decoding happens many times",
    "Prompt encoder embeds points, boxes, or masks into the same space; the mask decoder cross-attends between prompt and image embeddings to produce a mask plus a confidence score, in a few milliseconds",
    "Trained on a data engine that bootstraps itself: an initial model assists humans in labeling, generating more labels, which retrain a better model, generating more labels — repeated to build a billion-mask dataset"
  ],
  diagram:"sam",
  significance:"Generalized segmentation into a promptable, zero-shot task the way GPT generalized text tasks via prompting — a new task-formulation paradigm, not just a bigger segmentation network."
},
{
  id:"mamba", paper:{title:"Mamba: Linear-Time Sequence Modeling with Selective State Spaces", author:"Gu & Dao, 2023", url:"https://arxiv.org/abs/2312.00752"}, family:"recurrent", year:"2023", name:"Mamba (Selective State-Space Model)",
  concept:"Replaces self-attention entirely with a structured state-space model whose parameters are input-dependent ('selective') — letting the model decide, per-token, how much to remember or forget, while keeping the core sequence operation linear in sequence length instead of attention's quadratic cost.",
  mechanism:[
    "Continuous-time state-space model discretized: $h_t = A h_{t-1} + B x_t$, $y_t = C h_t$ — classical SSM form, but in Mamba the matrices A, B, C are themselves functions of the input $x_t$, not fixed",
    "This input-dependence ('selectivity') is what lets the model attend selectively to relevant tokens and ignore irrelevant ones — the property attention provides, but achieved through a recurrence rather than pairwise comparison",
    "A hardware-aware parallel scan algorithm computes this recurrence efficiently on GPUs despite its sequential-looking recursive form, avoiding the $O(n^2)$ cost of computing all pairwise attention scores"
  ],
  diagram:"mamba",
  significance:"The first credible architectural alternative to the Transformer at scale — for very long sequences, its linear-time cost is a real structural advantage over attention's quadratic scaling, motivating ongoing hybrid attention+SSM architectures."
},
{
  id:"dpo", paper:{title:"Direct Preference Optimization: Your Language Model is Secretly a Reward Model", author:"Rafailov et al., 2023", url:"https://arxiv.org/abs/2305.18290"}, family:"efficiency", year:"2023", name:"Direct Preference Optimization (DPO)",
  concept:"Achieves the same goal as RLHF — aligning a model to human preference data — but collapses the separate reward-model-training and RL-fine-tuning stages into a single closed-form loss computed directly on preference pairs, with no reward model and no reinforcement learning loop needed.",
  mechanism:[
    "Key insight: the optimal RLHF policy has a known closed form in terms of the reward, which means the reward can be substituted out of the preference loss algebraically",
    "Resulting loss is a simple classification objective directly on the policy: $\\mathcal{L}_{DPO} = -\\log \\sigma\\left(\\beta \\log\\frac{\\pi_\\theta(y_w|x)}{\\pi_{ref}(y_w|x)} - \\beta \\log\\frac{\\pi_\\theta(y_l|x)}{\\pi_{ref}(y_l|x)}\\right)$",
    "Trained with standard supervised-learning-style gradient descent on preference pairs — no reward model, no PPO, no RL instability, no separate training stage"
  ],
  diagram:"dpo",
  significance:"Made preference-alignment dramatically simpler and more stable to implement than RLHF, and is now a widely-used default for the alignment stage of open-weight model training pipelines."
},
{
  id:"dit", paper:{title:"Scalable Diffusion Models with Transformers", author:"Peebles & Xie, 2023", url:"https://arxiv.org/abs/2212.09748"}, family:"generative", year:"2023", name:"Diffusion Transformer (DiT)",
  concept:"Replaces the U-Net backbone traditionally used inside diffusion models with a plain Transformer operating on image patches (much like ViT) — merging two previously separate architecture families and letting diffusion models inherit the Transformer's well-understood scaling behavior.",
  mechanism:[
    "Latent image is patchified into tokens (as in ViT), processed by standard Transformer blocks with self-attention and feed-forward layers",
    "Conditioning (timestep, class label, or text) is injected via adaptive layer normalization — the conditioning signal predicts per-channel scale and shift parameters applied inside each block's normalization step, rather than via cross-attention",
    "Like LLMs, DiT shows smooth, predictable improvement in image quality as you scale model size and training compute — a property the U-Net backbone didn't exhibit as cleanly"
  ],
  diagram:"dit",
  significance:"Brought diffusion image/video generation onto the same scaling-law-driven trajectory that had worked for LLMs — this is the backbone underlying Sora and most current state-of-the-art generative video systems."
},
{
  id:"deepseek", paper:{title:"DeepSeek-V3 Technical Report", author:"DeepSeek-AI, 2024", url:"https://arxiv.org/abs/2412.19437"}, family:"efficiency", year:"2024", name:"DeepSeek-V2/V3 — MoE + Multi-Head Latent Attention",
  concept:"Combines fine-grained Mixture-of-Experts (many small experts rather than few large ones) with a novel attention variant that compresses the key-value cache into a small latent vector — attacking both the parameter-efficiency problem (via MoE) and the inference-memory problem (via compressed KV cache) simultaneously.",
  mechanism:[
    "Fine-grained MoE: instead of e.g. 8 large experts, use many more, smaller experts plus always-active 'shared' experts that capture common knowledge every token needs, improving specialization and reducing redundancy between experts",
    "Multi-head latent attention (MLA): instead of caching full keys and values per attention head, compress them into one low-rank latent vector per token, then reconstruct per-head keys/values from it on demand: $\\mathbf{c}_t = W_{DKV}\\mathbf{h}_t$, then $k_t = W_{UK}\\mathbf{c}_t$",
    "This shrinks the KV cache (the dominant memory cost during long-context inference) by a large factor versus standard multi-head attention, since only the small latent vector needs to be stored per token, not full per-head keys/values"
  ],
  diagram:"mla",
  significance:"Achieved frontier-level performance at dramatically lower training and inference cost than comparable dense models, demonstrated openly with reproducible weights — a high-profile example of architectural efficiency innovation (rather than just scale) coming from a Chinese lab."
},
{
  id:"o1", paper:{title:"Learning to Reason with LLMs (OpenAI o1 System Card)", author:"OpenAI, 2024", url:"https://openai.com/index/learning-to-reason-with-llms/"}, family:"reasoning", year:"2024", name:"OpenAI o1 — RL on Chain-of-Thought",
  concept:"Trains the model via reinforcement learning to generate an extended internal reasoning process before producing a final answer, and to allocate more or less of this 'thinking' depending on problem difficulty — trading inference-time compute for accuracy, rather than relying purely on what was learned at pretraining time.",
  mechanism:[
    "Architecturally still a standard decoder-only Transformer — the innovation is entirely in the training objective and inference-time behavior, not a new layer type",
    "RL reward is computed on the correctness of the final answer (verifiable on math/code problems), while the model is free to generate arbitrarily long intermediate reasoning tokens before committing to that answer — the reasoning trace is optimized implicitly, as whatever leads to correct final answers",
    "At inference, more 'thinking tokens' generated before the final answer generally improves accuracy on hard problems — performance becomes a function of inference-time compute, not just model size, which is the core new idea"
  ],
  diagram:"reasoning",
  significance:"Introduced 'test-time compute' as a third scaling axis alongside model size and training data — a problem can be made more solvable by letting the model think longer at inference time, opening an entirely new dimension for capability improvement."
},
{
  id:"r1", paper:{title:"DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", author:"DeepSeek-AI, 2025", url:"https://arxiv.org/abs/2501.12948"}, family:"reasoning", year:"2025", name:"DeepSeek-R1 — RL on Verifiable Rewards",
  concept:"Reproduces o1-style extended reasoning, but trains it primarily via reinforcement learning on automatically verifiable rewards (e.g. 'did the code compile and pass tests', 'is the final math answer correct') rather than relying on human-labeled chain-of-thought examples — and showed reasoning ability can emerge from RL alone, without an initial supervised reasoning-data stage.",
  mechanism:[
    "Reward signal is rule-based and automatic: correctness of a final math answer, or whether generated code passes unit tests — no learned reward model and no human preference labels are required for this stage",
    "An early version (R1-Zero) was trained with RL directly on a base pretrained model with no supervised fine-tuning step at all, and still developed long, structured chain-of-thought reasoning behavior — extended reasoning emerged purely from the RL incentive to get verifiable answers right",
    "The full R1 release adds a small supervised cold-start stage before RL, mainly to make the reasoning traces more readable to humans, since R1-Zero's traces were effective but sometimes hard to follow"
  ],
  diagram:"reasoning",
  significance:"Demonstrated, openly and reproducibly, that extended reasoning capability doesn't require expensive human-annotated reasoning traces — a distinct training-signal innovation from a Chinese lab that significantly lowered the cost of building reasoning-capable models."
},
{
  id:"interaction", paper:{title:"On Building Interaction Models", author:"Thinking Machines Lab, 2026", url:"https://thinkingmachines.ai/blog/"}, family:"multimodal", year:"2026", name:"Interaction Models (Thinking Machines Lab)",
  concept:"Standard LLMs have no sense of time passing — they only know about time if it's written into the prompt as text, and they process a conversation in complete back-and-forth turns. Interaction Models instead treat both listening and speaking as continuous streams chopped into fixed 200ms time-slices, processed simultaneously rather than as alternating turns — giving the model a native 'clock' and letting it listen while it speaks, react to silence, and handle interruptions.",
  mechanism:[
    "Multi-stream micro-turn design: every 200ms, the model simultaneously processes a chunk of incoming audio/video/text and generates a chunk of outgoing response — input and output streams run in parallel, not sequentially turn-by-turn",
    "Two cooperating models share full context: a fast 'interaction model' stays continuously live with the user for natural-feeling timing, while a separate 'background model' handles slower reasoning and tool calls asynchronously, feeding results back into the live stream as they complete",
    "Encoder-free early fusion: raw audio (via a representation called dMel) and small video patches are fed through lightweight embedding layers directly into the Transformer, with no separately pretrained speech-recognition or vision encoder bolted on — everything is co-trained from scratch together"
  ],
  diagram:"interaction",
  significance:"Reframes real-time voice/video interaction as a native architectural property — a model that experiences time as a first-class input — rather than a software 'harness' of turn-detection and latency hacks wrapped around an ordinary turn-based LLM."
}
];
