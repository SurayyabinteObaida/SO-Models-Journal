// Block taxonomy for the "Solve the Problem" pipeline builder.
// Each block has a category (used for color-coding + connection rules) and
// a list of which problem inputTypes it's valid for.

const BLOCK_CATEGORIES = {
  data: { label: "Data", color: "#8A5A2B" },
  preprocessing: { label: "Preprocessing", color: "#6B4C9A" },
  representation: { label: "Representation", color: "#1E7A6F" },
  model: { label: "Model", color: "#2B4C7E" },
  combiner: { label: "Combiner", color: "#A8821E" },
  postprocessing: { label: "Postprocessing", color: "#C76E3C" },
  output: { label: "Output", color: "#B23A5C" },
};

// inputTypes a block accepts as upstream input, and what it produces downstream.
// "any" means it accepts/produces a generic signal (used for combiners/outputs).
const BLOCKS = [
  // ---- data ----
  { id: "data:raw-text", category: "data", label: "Raw text", produces: "text", accepts: [] },
  { id: "data:raw-image", category: "data", label: "Raw image", produces: "image", accepts: [] },
  { id: "data:tabular", category: "data", label: "Tabular features", produces: "tabular", accepts: [] },
  { id: "data:audio", category: "data", label: "Raw audio", produces: "audio", accepts: [] },

  // ---- preprocessing ----
  { id: "prep:tokenize", category: "preprocessing", label: "Tokenize", produces: "tokens", accepts: ["text"] },
  { id: "prep:normalize-text", category: "preprocessing", label: "Lowercase / normalize", produces: "text", accepts: ["text"] },
  { id: "prep:remove-stopwords", category: "preprocessing", label: "Remove stopwords", produces: "tokens", accepts: ["tokens"] },
  { id: "prep:image-resize", category: "preprocessing", label: "Resize / crop", produces: "image", accepts: ["image"] },
  { id: "prep:augment", category: "preprocessing", label: "Data augmentation", produces: "image", accepts: ["image"] },
  { id: "prep:normalize-tabular", category: "preprocessing", label: "Normalize / scale", produces: "tabular", accepts: ["tabular"] },
  { id: "prep:audio-spectrogram", category: "preprocessing", label: "Spectrogram extraction", produces: "image", accepts: ["audio"] },
  { id: "prep:audio-mfcc", category: "preprocessing", label: "MFCC feature extraction", produces: "vector-seq", accepts: ["audio"] },

  // ---- representation ----
  { id: "rep:tfidf", category: "representation", label: "TF-IDF", produces: "vector", accepts: ["tokens", "text"] },
  { id: "rep:word-embed", category: "representation", label: "Word embeddings (Word2Vec/GloVe)", produces: "vector-seq", accepts: ["tokens"] },
  { id: "rep:bert-embed", category: "representation", label: "BERT embeddings", produces: "vector-seq", accepts: ["tokens", "text"] },
  { id: "rep:cnn-features", category: "representation", label: "CNN feature extractor", produces: "vector", accepts: ["image"] },
  { id: "rep:onehot", category: "representation", label: "One-hot encoding", produces: "vector", accepts: ["tabular"] },

  // ---- model ----
  { id: "model:logreg", category: "model", label: "Logistic regression", produces: "score", accepts: ["vector"] },
  { id: "model:svm", category: "model", label: "SVM", produces: "score", accepts: ["vector"] },
  { id: "model:gbm", category: "model", label: "Gradient boosting (XGBoost/LightGBM)", produces: "score", accepts: ["vector"] },
  { id: "model:cnn", category: "model", label: "CNN classifier", produces: "score", accepts: ["image", "vector"] },
  { id: "model:lstm", category: "model", label: "LSTM / RNN", produces: "score", accepts: ["vector-seq"] },
  { id: "model:transformer", category: "model", label: "Transformer / fine-tuned BERT", produces: "score", accepts: ["vector-seq", "text"] },
  { id: "model:rule-based", category: "model", label: "Rule-based / keyword matcher", produces: "score", accepts: ["text", "tokens", "tabular"] },

  // ---- combiner ----
  { id: "combine:vote", category: "combiner", label: "Majority vote", produces: "score", accepts: ["score"], minInputs: 2 },
  { id: "combine:weighted-avg", category: "combiner", label: "Weighted average", produces: "score", accepts: ["score"], minInputs: 2 },
  { id: "combine:stacking", category: "combiner", label: "Stacking (meta-model)", produces: "score", accepts: ["score"], minInputs: 2 },
  { id: "combine:concat", category: "combiner", label: "Feature concatenation", produces: "vector", accepts: ["vector", "vector-seq"], minInputs: 2 },

  // ---- postprocessing ----
  { id: "post:threshold", category: "postprocessing", label: "Threshold", produces: "label", accepts: ["score"] },
  { id: "post:calibrate", category: "postprocessing", label: "Probability calibration", produces: "score", accepts: ["score"] },
  { id: "post:topk", category: "postprocessing", label: "Top-k selection", produces: "label", accepts: ["score"] },
  { id: "post:human-review", category: "postprocessing", label: "Human-in-the-loop review queue", produces: "label", accepts: ["score", "label"] },

  // ---- output ----
  { id: "out:label", category: "output", label: "Classification label", produces: "final", accepts: ["label", "score"] },
  { id: "out:score", category: "output", label: "Risk score", produces: "final", accepts: ["score"] },
  { id: "out:ranked-list", category: "output", label: "Ranked list", produces: "final", accepts: ["label", "score"] },
];

// ---------- Problem definitions ----------
// Each problem: inputType (what data:* blocks are valid), validBlockIds (allowlist
// pulled from BLOCKS above), and a heuristic ruleset the backend-free heuristic
// checker evaluates against the user's graph.

const PROBLEMS = [
  // 1. VERIFIED LAST SESSION — do not alter shape, only reference.
  {
    id: "toxic-comments",
    title: "Toxic comment detection",
    blurb: "Flag harmful or abusive comments on a platform before they're published.",
    inputType: "text",
    validBlockIds: [
      "data:raw-text",
      "prep:tokenize", "prep:normalize-text", "prep:remove-stopwords",
      "rep:tfidf", "rep:word-embed", "rep:bert-embed",
      "model:logreg", "model:svm", "model:gbm", "model:lstm", "model:transformer", "model:rule-based",
      "combine:vote", "combine:weighted-avg", "combine:stacking",
      "post:threshold", "post:calibrate", "post:human-review",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-text"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-image", "data:tabular", "data:audio"],
      notes: "A real system needs a text representation step before a classifier can run on it — going straight from raw text to a model that only accepts vectors won't type-check.",
    },
  },

  // 2. Spam email detection — text, linear, rule-based contrast
  {
    id: "spam-email",
    title: "Spam email detection",
    blurb: "Sort incoming email into spam and inbox before it reaches the user.",
    inputType: "text",
    validBlockIds: [
      "data:raw-text",
      "prep:tokenize", "prep:normalize-text", "prep:remove-stopwords",
      "rep:tfidf", "rep:word-embed",
      "model:logreg", "model:svm", "model:gbm", "model:rule-based",
      "post:threshold", "post:calibrate",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-text"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-image", "data:tabular", "data:audio"],
      notes: "Spam filters are a classic bag-of-words problem — TF-IDF plus a linear or rule-based classifier is usually enough; no representation step means feeding raw text straight into a model that expects vectors.",
    },
  },

  // 3. Image-based defect detection — image, linear, CNN-focused
  {
    id: "defect-detection",
    title: "Manufacturing defect detection",
    blurb: "Inspect product images on a factory line and flag defective units.",
    inputType: "image",
    validBlockIds: [
      "data:raw-image",
      "prep:image-resize", "prep:augment",
      "rep:cnn-features",
      "model:cnn", "model:svm", "model:gbm",
      "post:threshold", "post:calibrate", "post:human-review",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-image"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-text", "data:tabular", "data:audio"],
      notes: "Images need resizing to a consistent shape before any model can batch them, and a CNN can consume raw pixels directly while SVM/GBM need explicit CNN-feature extraction first.",
    },
  },

  // 4. Customer churn prediction — tabular, linear, classic ML
  {
    id: "churn-prediction",
    title: "Customer churn prediction",
    blurb: "Predict which subscribers are likely to cancel next month from account activity data.",
    inputType: "tabular",
    validBlockIds: [
      "data:tabular",
      "prep:normalize-tabular",
      "rep:onehot",
      "model:logreg", "model:gbm", "model:svm",
      "post:threshold", "post:calibrate",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:tabular"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-text", "data:raw-image", "data:audio"],
      notes: "Tabular churn data mixes categorical and numeric fields — normalizing/encoding before the model matters, otherwise a feature like 'plan_type' fed raw into logistic regression doesn't make numerical sense.",
    },
  },

  // 5. Sentiment analysis — text, BRANCHING (lstm path + transformer path -> stacking)
  {
    id: "review-sentiment",
    title: "Product review sentiment analysis",
    blurb: "Classify customer reviews as positive, negative, or mixed to feed a product dashboard.",
    inputType: "text",
    validBlockIds: [
      "data:raw-text",
      "prep:tokenize", "prep:normalize-text",
      "rep:word-embed", "rep:bert-embed", "rep:tfidf",
      "model:lstm", "model:transformer", "model:logreg", "model:svm",
      "combine:vote", "combine:weighted-avg", "combine:stacking",
      "post:threshold", "post:calibrate",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-text"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-image", "data:tabular", "data:audio"],
      preferredPattern: "branching",
      notes: "Sentiment is a good candidate for an ensemble: a word-embedding+LSTM path catches sequence patterns, a BERT-embedding+transformer path catches context, and combining both through stacking outperforms either alone — though a single clean path is also valid.",
    },
    referenceBranchingSolution: {
      description: "Two parallel paths combined via stacking",
      path: {
        nodes: [
          "data:raw-text", "prep:tokenize",
          "rep:word-embed", "model:lstm",
          "rep:bert-embed", "model:transformer",
          "combine:stacking", "post:threshold", "out:label",
        ],
        edges: [
          ["data:raw-text", "prep:tokenize"],
          ["prep:tokenize", "rep:word-embed"],
          ["rep:word-embed", "model:lstm"],
          ["prep:tokenize", "rep:bert-embed"],
          ["rep:bert-embed", "model:transformer"],
          ["model:lstm", "combine:stacking"],
          ["model:transformer", "combine:stacking"],
          ["combine:stacking", "post:threshold"],
          ["post:threshold", "out:label"],
        ],
      },
    },
  },

  // 6. Medical image diagnosis — image, BRANCHING (cnn ensemble -> vote -> human review)
  {
    id: "medical-diagnosis",
    title: "Medical scan diagnosis support",
    blurb: "Flag suspicious regions in diagnostic scans (benign vs malignant) to assist a radiologist.",
    inputType: "image",
    validBlockIds: [
      "data:raw-image",
      "prep:image-resize", "prep:augment",
      "rep:cnn-features",
      "model:cnn", "model:svm",
      "combine:vote", "combine:weighted-avg",
      "post:threshold", "post:calibrate", "post:human-review",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-image"],
      mustEndWith: ["out:label", "out:score"],
      mustInclude: ["post:human-review"],
      forbiddenCategories: ["data:raw-text", "data:tabular", "data:audio"],
      preferredPattern: "branching",
      notes: "High-stakes diagnosis calls for an ensemble of CNNs combined by vote or weighted average to reduce single-model error, and a mandatory human-review step before any label is finalized — no fully automated path should reach the output alone.",
    },
    referenceBranchingSolution: {
      description: "CNN ensemble combined by vote, routed through mandatory human review",
      path: {
        nodes: [
          "data:raw-image", "prep:image-resize",
          "rep:cnn-features", "model:cnn",
          "prep:augment", "model:svm",
          "combine:vote", "post:human-review", "out:label",
        ],
        edges: [
          ["data:raw-image", "prep:image-resize"],
          ["prep:image-resize", "rep:cnn-features"],
          ["rep:cnn-features", "model:cnn"],
          ["prep:image-resize", "prep:augment"],
          ["prep:augment", "rep:cnn-features"],
          ["rep:cnn-features", "model:svm"],
          ["model:cnn", "combine:vote"],
          ["model:svm", "combine:vote"],
          ["combine:vote", "post:human-review"],
          ["post:human-review", "out:label"],
        ],
      },
    },
  },

  // 7. Fraud transaction detection — tabular, BRANCHING (gbm + rule-based -> weighted-avg)
  {
    id: "fraud-detection",
    title: "Fraud transaction detection",
    blurb: "Score incoming card transactions in real time and flag likely fraud for review.",
    inputType: "tabular",
    validBlockIds: [
      "data:tabular",
      "prep:normalize-tabular",
      "rep:onehot",
      "model:gbm", "model:logreg", "model:rule-based",
      "combine:weighted-avg", "combine:vote",
      "post:threshold", "post:calibrate", "post:human-review",
      "out:label", "out:score",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:tabular"],
      mustEndWith: ["out:label", "out:score"],
      forbiddenCategories: ["data:raw-text", "data:raw-image", "data:audio"],
      preferredPattern: "branching",
      notes: "Production fraud systems rarely rely on a learned model alone — a GBM trained on transaction features paired with hand-written rules (e.g. impossible travel velocity) and combined via weighted average catches cases neither would alone.",
    },
    referenceBranchingSolution: {
      description: "Learned model and rule-based path combined via weighted average",
      path: {
        nodes: [
          "data:tabular", "prep:normalize-tabular",
          "rep:onehot", "model:gbm",
          "model:rule-based",
          "combine:weighted-avg", "post:calibrate", "out:score",
        ],
        edges: [
          ["data:tabular", "prep:normalize-tabular"],
          ["prep:normalize-tabular", "rep:onehot"],
          ["rep:onehot", "model:gbm"],
          ["data:tabular", "model:rule-based"],
          ["model:gbm", "combine:weighted-avg"],
          ["model:rule-based", "combine:weighted-avg"],
          ["combine:weighted-avg", "post:calibrate"],
          ["post:calibrate", "out:score"],
        ],
      },
    },
  },

  // 8. Speech command recognition — audio, linear, exercises audio-only blocks
  {
    id: "speech-commands",
    title: "Speech command recognition",
    blurb: "Recognize short spoken commands (\"stop\", \"go\", \"yes\", \"no\") for a voice-controlled device.",
    inputType: "audio",
    validBlockIds: [
      "data:audio",
      "prep:audio-spectrogram", "prep:audio-mfcc",
      "rep:cnn-features",
      "model:cnn", "model:lstm",
      "post:threshold", "post:calibrate",
      "out:label",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:audio"],
      mustEndWith: ["out:label"],
      forbiddenCategories: ["data:raw-text", "data:raw-image", "data:tabular"],
      notes: "Raw audio has to become either a spectrogram (image-like, feeds a CNN) or MFCC features (sequence-like, feeds an LSTM) before any model block can accept it — audio waveforms aren't a valid model input on their own.",
    },
  },

  // 9. News topic classification — text, linear, multi-class via ranked-list/top-k
  {
    id: "news-topic-classification",
    title: "News article topic classification",
    blurb: "Sort incoming news articles into sections (politics, sports, tech, business) for a content platform.",
    inputType: "text",
    validBlockIds: [
      "data:raw-text",
      "prep:tokenize", "prep:normalize-text", "prep:remove-stopwords",
      "rep:tfidf", "rep:bert-embed",
      "model:logreg", "model:gbm", "model:transformer",
      "post:topk", "post:calibrate",
      "out:ranked-list", "out:label",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:raw-text"],
      mustEndWith: ["out:ranked-list", "out:label"],
      forbiddenCategories: ["data:raw-image", "data:tabular", "data:audio"],
      notes: "Multi-class topic assignment is naturally a ranked-list problem (top-k candidate sections) rather than a single threshold — top-k selection before the output makes that explicit, though a direct single-label path is also valid for a forced single-section system.",
    },
  },

  // 10. Resume screening / candidate ranking — tabular, BRANCHING (stacking -> ranked-list + human review)
  {
    id: "resume-screening",
    title: "Resume screening and candidate ranking",
    blurb: "Rank job applicants by fit from structured resume features for a recruiter's shortlist.",
    inputType: "tabular",
    validBlockIds: [
      "data:tabular",
      "prep:normalize-tabular",
      "rep:onehot",
      "model:logreg", "model:gbm",
      "combine:stacking", "combine:weighted-avg",
      "post:topk", "post:human-review", "post:calibrate",
      "out:ranked-list",
    ],
    heuristic: {
      requiredCategories: ["data", "model", "output"],
      mustStartWith: ["data:tabular"],
      mustEndWith: ["out:ranked-list"],
      mustInclude: ["post:human-review"],
      forbiddenCategories: ["data:raw-text", "data:raw-image", "data:audio"],
      preferredPattern: "branching",
      notes: "Candidate ranking carries real fairness stakes — stacking two differently-biased models (logistic regression and GBM) is more robust than either alone, and a human-review step before the final ranked list is non-negotiable, not optional polish.",
    },
    referenceBranchingSolution: {
      description: "Two models combined via stacking, routed through human review before ranking",
      path: {
        nodes: [
          "data:tabular", "prep:normalize-tabular",
          "rep:onehot", "model:logreg",
          "model:gbm",
          "combine:stacking", "post:topk", "post:human-review", "out:ranked-list",
        ],
        edges: [
          ["data:tabular", "prep:normalize-tabular"],
          ["prep:normalize-tabular", "rep:onehot"],
          ["rep:onehot", "model:logreg"],
          ["rep:onehot", "model:gbm"],
          ["model:logreg", "combine:stacking"],
          ["model:gbm", "combine:stacking"],
          ["combine:stacking", "post:topk"],
          ["post:topk", "post:human-review"],
          ["post:human-review", "out:ranked-list"],
        ],
      },
    },
  },
];
