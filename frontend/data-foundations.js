// FOUNDATIONS: 25 core architectures, chronological
const FOUNDATIONS = [
{
  id:"perceptron", paper:{title:"The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain", author:"Rosenblatt, 1958", url:"https://psycnet.apa.org/record/1959-09865-001"}, family:"foundation", year:"1958", name:"Perceptron",
  concept:"The first trainable artificial neuron. A perceptron takes a vector of inputs, computes a weighted sum, and passes it through a hard threshold to produce a binary output. Learning is a simple error-correction rule: nudge weights toward inputs that were misclassified.",
  mechanism:[
    "Output: $y = \\text{step}(\\mathbf{w}\\cdot\\mathbf{x} + b)$, where step(z) = 1 if z > 0 else 0",
    "Update rule (per misclassified sample): $\\mathbf{w} \\leftarrow \\mathbf{w} + \\eta (y_{true} - y_{pred})\\mathbf{x}$",
    "Geometrically: the weight vector defines a hyperplane; the perceptron can only separate data that is linearly separable. Minsky & Papert's 1969 critique (it cannot learn XOR) froze neural net research for over a decade."
  ],
  diagram:"perceptron",
  significance:"Established the core recipe every later network reuses: weighted sum → nonlinearity → error-driven weight update. Its limitation (linear separability only) directly motivated stacking layers, which is the entire premise of the MLP."
},
{
  id:"hopfield", paper:{title:"Neural networks and physical systems with emergent collective computational abilities", author:"Hopfield, 1982", url:"https://www.pnas.org/doi/10.1073/pnas.79.8.2554"}, family:"recurrent", year:"1982", name:"Hopfield Network",
  concept:"A fully-connected recurrent network that stores patterns as stable low-energy states. Given a corrupted or partial input, the network's dynamics converge to the nearest stored memory — content-addressable memory implemented as energy minimization.",
  mechanism:[
    "Energy function: $E = -\\frac{1}{2}\\sum_{i,j} w_{ij} s_i s_j$",
    "Each neuron updates asynchronously: $s_i \\leftarrow \\text{sign}\\left(\\sum_j w_{ij}s_j\\right)$, which provably never increases E",
    "Weights are set directly from training patterns via Hebbian outer-product storage — no gradient descent needed: $w_{ij} = \\sum_p \\xi_i^p \\xi_j^p$"
  ],
  diagram:"hopfield",
  significance:"Introduced the idea of a network as a dynamical system settling into an attractor — a framing that resurfaces in modern associative-memory views of attention (some researchers describe Transformer attention as a generalized Hopfield network)."
},
{
  id:"mlp", paper:{title:"Learning representations by back-propagating errors", author:"Rumelhart, Hinton & Williams, 1986", url:"https://www.nature.com/articles/323533a0"}, family:"foundation", year:"1986", name:"Multilayer Perceptron (MLP)",
  concept:"Stacking layers of perceptron-like units with smooth, differentiable nonlinearities, trained end-to-end by backpropagating an error signal from output to input via the chain rule.",
  mechanism:[
    "Forward pass per layer: $\\mathbf{h}^{(l)} = \\sigma(W^{(l)}\\mathbf{h}^{(l-1)} + \\mathbf{b}^{(l)})$",
    "Backprop: gradient of loss w.r.t. any weight is computed by repeated application of the chain rule backward through layers: $\\frac{\\partial L}{\\partial W^{(l)}} = \\frac{\\partial L}{\\partial \\mathbf{h}^{(l)}}\\cdot\\frac{\\partial \\mathbf{h}^{(l)}}{\\partial W^{(l)}}$",
    "A smooth nonlinearity (originally sigmoid/tanh) is essential — it's what makes the network differentiable and able to approximate arbitrary continuous functions (universal approximation theorem)."
  ],
  diagram:"mlp",
  significance:"This is the foundational template — every architecture below is, at some level, layers of differentiable transformations trained by backprop. Depth solved the linear-separability ceiling of the perceptron."
},
{
  id:"lenet", paper:{title:"Gradient-Based Learning Applied to Document Recognition", author:"LeCun et al., 1998", url:"http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf"}, family:"vision", year:"1998", name:"LeNet-5",
  concept:"Applies convolution — sliding a small learned filter across an image — instead of fully connecting every pixel to every neuron. This bakes in translation invariance: a filter that detects an edge works the same wherever the edge appears.",
  mechanism:[
    "Convolution: $(I * K)(x,y) = \\sum_{i,j} I(x+i, y+j)\\,K(i,j)$ — a small kernel K is reused across all spatial positions, drastically cutting parameters versus a fully-connected layer",
    "Pooling (e.g. max-pool) downsamples feature maps, giving local translation invariance and reducing computation for deeper layers",
    "Stack of [conv → pool] blocks followed by fully-connected layers for classification"
  ],
  diagram:"cnn",
  significance:"Parameter sharing via convolution is the single biggest reason CNNs scaled to real images where MLPs couldn't. Every vision architecture through 2020 (AlexNet, VGG, ResNet) is a variation on this conv+pool template."
},
{
  id:"svm", paper:{title:"A Training Algorithm for Optimal Margin Classifiers", author:"Boser, Guyon & Vapnik, 1992", url:"https://dl.acm.org/doi/10.1145/130385.130401"}, family:"foundation", year:"1990s", name:"Support Vector Machine (SVM)",
  concept:"Finds the hyperplane that separates two classes with the maximum margin — not just any separating line, but the one furthest from both classes. The 'kernel trick' lets it do this in high-dimensional (even infinite-dimensional) feature spaces without ever computing the transformed features explicitly.",
  mechanism:[
    "Decision function: $f(x) = \\text{sign}\\left(\\sum_i \\alpha_i y_i K(x_i, x) + b\\right)$",
    "Kernel trick: $K(x_i, x_j) = \\phi(x_i)\\cdot\\phi(x_j)$ computes a dot product in a transformed space without materializing $\\phi$ — e.g. RBF kernel $K(x_i,x_j)=\\exp(-\\gamma\\|x_i-x_j\\|^2)$",
    "Margin maximization is a convex quadratic program — unlike neural nets, SVM training has a single global optimum, no local minima."
  ],
  diagram:"svm",
  significance:"Dominated tabular/small-data ML through the 2000s precisely because it didn't need huge datasets or careful tuning to avoid local minima — a real architectural alternative to deep nets, not a stepping stone to them."
},
{
  id:"lstm", paper:{title:"Long Short-Term Memory", author:"Hochreiter & Schmidhuber, 1997", url:"https://www.bioinf.jku.at/publications/older/2604.pdf"}, family:"recurrent", year:"1997", name:"LSTM",
  concept:"A recurrent unit with a separate 'memory cell' protected by learned gates, solving the vanishing-gradient problem that crippled plain RNNs on long sequences. Gates learn when to write to, read from, or erase the memory.",
  mechanism:[
    "Forget gate: $f_t = \\sigma(W_f[h_{t-1}, x_t] + b_f)$ — decides what fraction of old memory to keep",
    "Input/output gates similarly control writing new info in and reading info out: $i_t=\\sigma(\\cdot)$, $o_t=\\sigma(\\cdot)$",
    "Cell update: $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$ — note the additive update through the forget gate; this additive path (vs. repeated multiplication in plain RNNs) is exactly what keeps gradients from vanishing over long sequences."
  ],
  diagram:"lstm",
  significance:"For nearly two decades, LSTMs were the default for any sequence task — translation, speech, time series — until the Transformer showed self-attention could capture long-range dependencies without recurrence at all."
},
{
  id:"dbn", paper:{title:"A Fast Learning Algorithm for Deep Belief Nets", author:"Hinton, Osindero & Teh, 2006", url:"https://www.cs.toronto.edu/~hinton/absps/fastnc.pdf"}, family:"foundation", year:"2006", name:"Deep Belief Network",
  concept:"Stacks Restricted Boltzmann Machines (RBMs) and pretrains them one layer at a time, unsupervised, before fine-tuning the whole stack. This greedy layer-wise pretraining was the trick that let networks go deep before good initialization/optimization tricks existed.",
  mechanism:[
    "Each RBM layer learns $P(\\mathbf{v}, \\mathbf{h}) \\propto e^{-E(\\mathbf{v},\\mathbf{h})}$ with energy $E = -\\mathbf{v}^TW\\mathbf{h} - \\mathbf{b}^T\\mathbf{v} - \\mathbf{c}^T\\mathbf{h}$",
    "Trained via contrastive divergence — approximate the gradient by comparing data samples to samples from short Markov-chain reconstructions",
    "Layer-wise stacking: layer 1's learned hidden activations become layer 2's visible inputs, repeated up the stack, then the whole thing is fine-tuned with backprop"
  ],
  diagram:"dbn",
  significance:"Hinton's 2006 paper is widely credited as the spark that reignited 'deep learning' as a label and a research direction, even though the specific RBM-stacking technique was later superseded by better initialization, ReLU, and batch norm."
},
{
  id:"alexnet", paper:{title:"ImageNet Classification with Deep Convolutional Neural Networks", author:"Krizhevsky, Sutskever & Hinton, 2012", url:"https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html"}, family:"vision", year:"2012", name:"AlexNet",
  concept:"A deep CNN trained on GPUs with ReLU activations and dropout regularization, that beat every prior ImageNet entry by a huge margin. It proved that depth + scale + GPU compute, not clever feature engineering, was the path forward for vision.",
  mechanism:[
    "ReLU: $f(x) = \\max(0,x)$ — non-saturating, so gradients don't vanish the way they do with sigmoid/tanh, enabling much deeper training",
    "Dropout: randomly zeroes a fraction p of activations during training, forcing redundant, non-co-dependent representations and reducing overfitting",
    "Trained on two GPUs in parallel — an engineering decision as important as the architecture itself, since it made training at this depth and dataset size feasible"
  ],
  diagram:"cnn",
  significance:"The 2012 ImageNet result is the conventional start date of the modern deep learning boom — it's the paper that convinced the field depth+data+compute beats hand-engineered features."
},
{
  id:"vgg", paper:{title:"Very Deep Convolutional Networks for Large-Scale Image Recognition", author:"Simonyan & Zisserman, 2014", url:"https://arxiv.org/abs/1409.1556"}, family:"vision", year:"2014", name:"VGGNet",
  concept:"Pushed depth further than AlexNet using a very uniform design: only small 3×3 convolutions, stacked many layers deep, with no architectural cleverness beyond depth itself.",
  mechanism:[
    "Stacking two 3×3 convolutions gives the same receptive field as one 5×5 convolution, but with fewer parameters and an extra nonlinearity in between — strictly more expressive for the same receptive field",
    "Uniform [conv3x3 → conv3x3 → maxpool] blocks repeated, doubling channel count after each pooling stage",
    "16–19 layers deep (VGG-16/19) — far deeper than AlexNet's 8, with no other architectural changes needed to make it work."
  ],
  diagram:"cnn",
  significance:"Showed depth alone, with no other trick, is a real performance lever — but also exposed how parameter-heavy naive depth gets, which directly motivated GoogLeNet's and ResNet's more efficient designs."
},
{
  id:"inception", paper:{title:"Going Deeper with Convolutions", author:"Szegedy et al., 2014", url:"https://arxiv.org/abs/1409.4842"}, family:"vision", year:"2014", name:"GoogLeNet / Inception",
  concept:"Instead of choosing one filter size per layer, run several filter sizes in parallel within the same block and concatenate their outputs — letting the network capture features at multiple scales simultaneously, efficiently.",
  mechanism:[
    "Inception block: parallel branches of 1x1, 3x3, 5x5 convolutions and a pooling op, all on the same input, concatenated channel-wise",
    "1x1 convolutions before the larger filters act as a 'bottleneck' — they reduce channel depth cheaply before the expensive 3x3/5x5 convs run, cutting compute drastically",
    "Auxiliary classifiers attached at intermediate layers inject extra gradient signal earlier in the network, helping train very deep stacks before techniques like batch norm existed."
  ],
  diagram:"inception",
  significance:"Demonstrated that smarter block design (multi-scale, bottlenecked) beats brute-force depth on a compute budget — a philosophy that echoes today in efficient architectures like MobileNet and, conceptually, in MoE's 'use compute selectively' principle."
},
{
  id:"seq2seq", paper:{title:"Sequence to Sequence Learning with Neural Networks", author:"Sutskever, Vinyals & Le, 2014", url:"https://arxiv.org/abs/1409.3215"}, family:"recurrent", year:"2014", name:"Seq2Seq (Encoder–Decoder)",
  concept:"Two RNNs: an encoder reads the entire input sequence and compresses it into one fixed-length vector; a decoder generates the output sequence conditioned on that vector. This let RNNs handle inputs and outputs of different, variable lengths — first major architecture for machine translation.",
  mechanism:[
    "Encoder: $h_t = f(h_{t-1}, x_t)$ run over the whole input, final hidden state $h_T$ is the 'context vector' summarizing everything",
    "Decoder: generates output tokens autoregressively, conditioned on $h_T$ and its own previous outputs: $s_t = g(s_{t-1}, y_{t-1}, h_T)$",
    "Trained with teacher forcing — during training, the decoder sees the true previous token rather than its own (possibly wrong) prediction, speeding convergence."
  ],
  diagram:"seq2seq",
  significance:"The fixed-length bottleneck vector — forcing an entire sentence into one vector regardless of length — was its key weakness, and is exactly the problem the attention mechanism (next entry) was invented to fix."
},
{
  id:"gan", paper:{title:"Generative Adversarial Networks", author:"Goodfellow et al., 2014", url:"https://arxiv.org/abs/1406.2661"}, family:"generative", year:"2014", name:"GAN",
  concept:"Two networks compete: a generator tries to produce fake data indistinguishable from real, a discriminator tries to tell real from fake. Training is a minimax game; at equilibrium the generator produces samples the discriminator can't distinguish from real data.",
  mechanism:[
    "Minimax objective: $\\min_G \\max_D \\; \\mathbb{E}_{x\\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z\\sim p_z}[\\log(1-D(G(z)))]$",
    "G maps random noise z to a generated sample; D outputs a probability that a given sample is real",
    "No explicit likelihood is ever computed — unlike VAEs, GANs sidestep modeling $p(x)$ directly, learning only to sample from it, which is part of why outputs look sharper but training is less stable."
  ],
  diagram:"gan",
  significance:"Defined an entirely new generative paradigm — adversarial training — that dominated image generation until diffusion models overtook it around 2021–2022 on stability and sample diversity."
},
{
  id:"vae", paper:{title:"Auto-Encoding Variational Bayes", author:"Kingma & Welling, 2013", url:"https://arxiv.org/abs/1312.6114"}, family:"generative", year:"2013", name:"VAE (Variational Autoencoder)",
  concept:"An autoencoder where the encoder outputs a probability distribution (mean and variance) over a latent code rather than a single point, and the model is trained to make that latent space follow a known prior (e.g. standard normal) — enabling generation by sampling the prior and decoding.",
  mechanism:[
    "Loss = reconstruction error + KL divergence regularizer: $\\mathcal{L} = \\mathbb{E}_{q(z|x)}[\\log p(x|z)] - D_{KL}(q(z|x)\\,\\|\\,p(z))$",
    "Reparameterization trick: sample $z = \\mu + \\sigma \\odot \\epsilon$, $\\epsilon\\sim\\mathcal{N}(0,1)$ — makes the sampling step differentiable so gradients can flow through it",
    "The KL term pulls every input's latent distribution toward the same prior, which is what makes the latent space smooth and sample-able after training."
  ],
  diagram:"vae",
  significance:"Gave generative modeling a principled probabilistic foundation with a tractable (if approximate) likelihood — and its compressed latent space is exactly what Stable Diffusion later reused to make diffusion computationally feasible."
},
{
  id:"resnet", paper:{title:"Deep Residual Learning for Image Recognition", author:"He et al., 2015", url:"https://arxiv.org/abs/1512.03385"}, family:"vision", year:"2015", name:"ResNet",
  concept:"Adds a 'skip connection' that lets a layer's input bypass straight to its output, added to whatever the layer computes. This means each layer only has to learn a small residual correction, not a full transformation — and gradients have a direct path back through the skip, solving the degradation problem in very deep nets.",
  mechanism:[
    "Residual block: $\\mathbf{y} = F(\\mathbf{x}, W) + \\mathbf{x}$, instead of $\\mathbf{y}=F(\\mathbf{x},W)$",
    "Backward pass: $\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{x}} = \\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{y}}\\left(\\frac{\\partial F}{\\partial \\mathbf{x}} + 1\\right)$ — that '+1' guarantees gradient never fully vanishes through a block, regardless of depth",
    "Enabled training networks 100+ layers deep (ResNet-152) where plain stacked CNNs actually got *worse* past ~20 layers due to optimization difficulty, not overfitting."
  ],
  diagram:"resnet",
  significance:"The skip connection is now a default ingredient in nearly every deep architecture, including Transformers (residual connections around both attention and feed-forward sub-layers) — arguably the single most copied idea on this list."
},
{
  id:"attention", paper:{title:"Neural Machine Translation by Jointly Learning to Align and Translate", author:"Bahdanau, Cho & Bengio, 2014", url:"https://arxiv.org/abs/1409.0473"}, family:"attention", year:"2015", name:"Attention Mechanism (Bahdanau)",
  concept:"Instead of forcing the encoder to compress an entire input into one fixed vector, let the decoder 'look back' at all encoder states at every decoding step and learn which ones are relevant right now via a learned weighting.",
  mechanism:[
    "Alignment scores: $e_{t,i} = a(s_{t-1}, h_i)$ — a small learned function scoring how relevant encoder state $h_i$ is to decoder step t",
    "Softmax normalizes scores into weights: $\\alpha_{t,i} = \\frac{\\exp(e_{t,i})}{\\sum_j \\exp(e_{t,j})}$",
    "Context vector for this step is a weighted sum: $c_t = \\sum_i \\alpha_{t,i} h_i$ — different at every decoding step, unlike Seq2Seq's single fixed vector"
  ],
  diagram:"attention",
  significance:"This is the direct conceptual ancestor of Transformer self-attention — it proved that letting a model dynamically reference different parts of its input, rather than compressing everything upfront, was a fundamentally better way to handle long sequences."
},
{
  id:"unet", paper:{title:"U-Net: Convolutional Networks for Biomedical Image Segmentation", author:"Ronneberger, Fischer & Brox, 2015", url:"https://arxiv.org/abs/1505.04597"}, family:"vision", year:"2015", name:"U-Net",
  concept:"An encoder-decoder CNN shaped like a 'U': the encoder downsamples to capture context, the decoder upsamples back to full resolution, and skip connections directly link each encoder stage to its mirrored decoder stage — preserving fine spatial detail that pure downsampling would destroy.",
  mechanism:[
    "Contracting path: repeated [conv → conv → maxpool], doubling channels and halving spatial resolution each stage",
    "Expansive path: upsampling (transposed conv) mirrored to the contracting path, with each stage concatenating in the corresponding skip-connected features from the encoder",
    "Output: a per-pixel prediction map at the original resolution — segmentation, not classification, is the task this architecture is built for"
  ],
  diagram:"unet",
  significance:"Became the default backbone for image segmentation, and much later, the U-Net's encoder-decoder-with-skip-connections shape was reused almost unchanged as the noise-prediction network inside Stable Diffusion."
},
{
  id:"transformer", paper:{title:"Attention Is All You Need", author:"Vaswani et al., 2017", url:"https://arxiv.org/abs/1706.03762"}, family:"attention", year:"2017", name:"Transformer",
  concept:"Replaces recurrence entirely with self-attention: every token directly attends to every other token in the sequence in parallel, with no step-by-step recurrent state to propagate. This makes training fully parallelizable across positions and captures long-range dependencies in one step rather than many.",
  mechanism:[
    "Scaled dot-product attention: $\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$ — Q, K, V are linear projections of the input",
    "Multi-head attention runs several attention computations in parallel with different learned projections, letting the model attend to different types of relationships simultaneously",
    "Since there's no recurrence to encode position, positional encodings (originally sinusoidal) are added to embeddings so the model knows token order"
  ],
  diagram:"transformer",
  significance:"The single most consequential architecture on this entire list — every major LLM, vision Transformer, and most modern generative model is a Transformer variant or directly builds on its attention mechanism."
},
{
  id:"bert", paper:{title:"BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", author:"Devlin et al., 2018", url:"https://arxiv.org/abs/1810.04805"}, family:"attention", year:"2018", name:"BERT",
  concept:"A bidirectional Transformer encoder pretrained by randomly masking tokens and predicting them from both left and right context simultaneously — unlike a left-to-right language model, it sees the whole sentence at once during pretraining.",
  mechanism:[
    "Masked language modeling objective: randomly replace ~15% of tokens with [MASK], train the model to predict the original token: $\\mathcal{L} = -\\sum_{i \\in masked} \\log P(x_i \\,|\\, x_{\\setminus masked})$",
    "Bidirectionality means each token's representation is influenced by every other token in the sequence (both before and after), which a causal/autoregressive model structurally cannot do",
    "Pretrain once on huge unlabeled text, then fine-tune the same weights on a small labeled dataset for a specific task — transfer learning for NLP, analogous to ImageNet-pretrained CNNs for vision"
  ],
  diagram:"bert",
  significance:"Established the pretrain-then-fine-tune paradigm that made large-scale unlabeled text useful for almost any downstream NLP task, and proved bidirectionality matters for understanding (as opposed to generation)."
},
{
  id:"gpt", paper:{title:"Improving Language Understanding by Generative Pre-Training", author:"Radford et al., 2018", url:"https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf"}, family:"attention", year:"2018", name:"GPT",
  concept:"A unidirectional (causal) Transformer decoder trained purely to predict the next token given everything before it. Simple objective, but it means the same model can generate text by repeatedly sampling its own next-token predictions.",
  mechanism:[
    "Causal language modeling: $\\mathcal{L} = -\\sum_t \\log P(x_t \\,|\\, x_{<t})$",
    "Causal masking in self-attention: a token at position t is only allowed to attend to positions $\\le t$, enforced by masking future positions to $-\\infty$ before the softmax",
    "Generation is autoregressive at inference time: sample $x_t \\sim P(\\cdot|x_{<t})$, append it, repeat — the same mechanism used in every chat LLM today"
  ],
  diagram:"gpt",
  significance:"This decoder-only, next-token-prediction recipe is the architecture behind essentially every modern conversational LLM — its simplicity, combined with the discovery that it scales remarkably well, is why it won out over BERT-style models for general-purpose generation."
},
{
  id:"gpt23", paper:{title:"Language Models are Few-Shot Learners (GPT-3)", author:"Brown et al., 2020", url:"https://arxiv.org/abs/2005.14165"}, family:"attention", year:"2019–2020", name:"GPT-2 / GPT-3",
  concept:"The same decoder-only Transformer architecture as GPT, scaled up by orders of magnitude in parameters and training data — with essentially no architectural innovation. The discovery was that capabilities like few-shot learning emerge from scale alone, without any task-specific training.",
  mechanism:[
    "Architecturally near-identical to GPT-1: same causal self-attention, same next-token objective, just more layers, wider hidden dimensions, and far more training tokens",
    "Few-shot/in-context learning: given a handful of examples in the prompt itself (no gradient updates), the model infers the task pattern and applies it — an emergent behavior, not something explicitly trained for",
    "GPT-3 (175B params) was the first model large enough to make this in-context learning reliably useful across many tasks"
  ],
  diagram:"scaling",
  significance:"Proved empirically that 'just scale it up' was a viable, even dominant, research strategy — triggering the scaling-laws-driven era that defined LLM research from 2020 onward, and motivated the search for efficient scaling (MoE, better data curricula) that follows."
},
{
  id:"vit", paper:{title:"An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", author:"Dosovitskiy et al., 2020", url:"https://arxiv.org/abs/2010.11929"}, family:"vision", year:"2020", name:"Vision Transformer (ViT)",
  concept:"Applies the unmodified Transformer encoder to images by chopping an image into fixed-size patches, treating each patch like a 'token' (via a linear projection), and feeding the resulting sequence through standard self-attention — no convolutions anywhere.",
  mechanism:[
    "Image of size H×W is split into N patches of size P×P, each flattened and linearly projected into a token embedding: $\\mathbf{x}_p \\in \\mathbb{R}^{P^2 \\cdot C} \\rightarrow \\mathbb{R}^{D}$",
    "A learnable [CLS] token is prepended, and its final-layer representation is used for classification — directly borrowed from BERT's [CLS] token convention",
    "Positional embeddings are added since patch order otherwise carries no spatial information to self-attention, exactly as positional encodings work in text Transformers"
  ],
  diagram:"vit",
  significance:"Showed that the inductive biases baked into CNNs (locality, translation invariance via shared kernels) aren't strictly necessary if you have enough data — a pure attention model can learn them from scratch, unifying vision and language under one architecture family."
},
{
  id:"diffusion", paper:{title:"Denoising Diffusion Probabilistic Models", author:"Ho, Jain & Abbeel, 2020", url:"https://arxiv.org/abs/2006.11239"}, family:"generative", year:"2020", name:"Diffusion Models (DDPM)",
  concept:"Train a network to reverse a fixed, gradual noising process: start from real data, add a little Gaussian noise repeatedly until it's pure noise, then train the model to predict and remove that noise one step at a time. Generation runs this reverse process from pure noise to a clean sample.",
  mechanism:[
    "Forward (noising) process is fixed, not learned: $q(x_t|x_{t-1}) = \\mathcal{N}(x_t; \\sqrt{1-\\beta_t}\\,x_{t-1}, \\beta_t I)$",
    "The network is trained to predict the noise added at each step: $\\mathcal{L} = \\mathbb{E}_{t,x_0,\\epsilon}\\left[\\|\\epsilon - \\epsilon_\\theta(x_t, t)\\|^2\\right]$ — a simple regression loss, much more stable to train than a GAN's adversarial game",
    "Sampling iteratively denoises: starting from pure noise $x_T$, repeatedly apply the learned reverse step to get $x_{T-1}, x_{T-2}, \\dots, x_0$"
  ],
  diagram:"diffusion",
  significance:"Surpassed GANs in image fidelity and especially training stability and sample diversity, and became the dominant generative paradigm for images, and later video — directly underlying Stable Diffusion, DALL-E 2/3, and Sora."
},
{
  id:"clip", paper:{title:"Learning Transferable Visual Models From Natural Language Supervision", author:"Radford et al., 2021", url:"https://arxiv.org/abs/2103.00020"}, family:"multimodal", year:"2021", name:"CLIP",
  concept:"Trains an image encoder and a text encoder jointly so that matching image-text pairs end up close together in a shared embedding space, and mismatched pairs end up far apart — using contrastive learning on hundreds of millions of naturally-occurring (image, caption) pairs from the web, no manual labels needed.",
  mechanism:[
    "Contrastive loss over a batch of N (image, text) pairs: maximize cosine similarity for the N matched pairs while minimizing it for all N²−N mismatched pairs in the same batch",
    "$\\mathcal{L} = -\\log \\frac{\\exp(\\text{sim}(I_i, T_i)/\\tau)}{\\sum_j \\exp(\\text{sim}(I_i, T_j)/\\tau)}$, applied symmetrically for image→text and text→image",
    "After training, zero-shot classification works by embedding candidate class names as text and picking whichever has highest cosine similarity to the image embedding — no task-specific fine-tuning needed"
  ],
  diagram:"clip",
  significance:"Created a shared vision-language embedding space that became foundational infrastructure for later multimodal systems — it's the component that lets text prompts 'steer' image generation in models like Stable Diffusion and DALL-E."
},
{
  id:"moe", paper:{title:"Switch Transformers: Scaling to Trillion Parameter Models", author:"Fedus, Zoph & Shazeer, 2021", url:"https://arxiv.org/abs/2101.03961"}, family:"efficiency", year:"2021–2022", name:"Mixture-of-Experts Transformer (Switch Transformer)",
  concept:"Replaces a single dense feed-forward layer with many parallel 'expert' feed-forward networks, and a learned router that sends each token to only one (or a few) experts. Total parameter count grows hugely, but the compute cost per token stays roughly fixed, since only a small subset of experts actually runs.",
  mechanism:[
    "Router computes a probability distribution over experts for each token: $p(x) = \\text{softmax}(W_r \\cdot x)$, then picks the top-1 (Switch) or top-k expert(s)",
    "Only the chosen expert(s) process the token: $y = p_i(x) \\cdot E_i(x)$ for the selected expert i — the other experts do zero work for that token",
    "An auxiliary load-balancing loss penalizes the router for sending too many tokens to the same expert, preventing a few experts from being overused while others go untrained"
  ],
  diagram:"moe",
  significance:"Decoupled total parameter count from per-token compute cost for the first time at scale — a structurally different axis for scaling models than simply making every layer bigger, and the direct ancestor of every major sparse LLM since (Mixtral, DeepSeek-V3, GPT-4's rumored architecture)."
}
];
