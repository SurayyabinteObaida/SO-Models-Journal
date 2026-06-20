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
  { id: "model:rule-based", category: "model", label: "Rule-based / keyword matcher", produces: "score", accepts: ["text", "tokens"] },

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
];
