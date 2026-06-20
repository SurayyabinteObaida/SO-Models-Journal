// Each function returns an SVG string sized to fit the reading pane.
// Palette pulled from the page tokens: ink #1A1A18, blue #2B4C7E, amber #C76E3C, rule #D8D4C8, paper #FAF8F3
const INK="#1A1A18", BLUE="#2B4C7E", AMBER="#C76E3C", RULE="#B8B2A0", PAPER="#FAF8F3";

function svgWrap(content, vb="0 0 600 280"){
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="diagram-svg">${content}</svg>`;
}
function lbl(x,y,t,opts={}){
  const size=opts.size||12, anchor=opts.anchor||"middle", color=opts.color||INK, weight=opts.weight||400, family=opts.mono?"'JetBrains Mono',monospace":"'Inter',sans-serif";
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${color}" font-family="${family}" font-weight="${weight}">${t}</text>`;
}
function arrow(x1,y1,x2,y2,color=INK,dash=""){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.6" marker-end="url(#arrowhead)" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
}
const ARROWDEF = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${INK}"/></marker></defs>`;

const DIAGRAMS = {

perceptron: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map((i)=>`<circle cx="80" cy="${70+i*70}" r="16" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>`).join('')}
  ${[0,1,2].map((i)=>lbl(80,75+i*70,`x${i+1}`)).join('')}
  ${[0,1,2].map((i)=>arrow(96,70+i*70,250,140,BLUE)).join('')}
  <circle cx="280" cy="140" r="26" fill="${PAPER}" stroke="${BLUE}" stroke-width="2"/>
  ${lbl(280,135,"Σ",{size:16,color:BLUE})}
  ${lbl(280,150,"+b",{size:9,color:BLUE})}
  ${arrow(306,140,400,140,INK)}
  <rect x="400" y="118" width="70" height="44" fill="none" stroke="${INK}" stroke-width="1.6"/>
  ${lbl(435,135,"step()",{size:11})}
  ${lbl(435,150,"threshold",{size:8,color:RULE})}
  ${arrow(470,140,540,140,INK)}
  ${lbl(560,144,"y",{size:13,weight:600})}
  ${lbl(300,240,"y = step( Σ wᵢxᵢ + b )",{size:12,mono:true,color:INK})}
`),

hopfield: ()=>svgWrap(`${ARROWDEF}
  ${(()=>{const pts=[[200,60],[340,60],[270,180],[140,180],[400,180]];let s='';
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){s+=`<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="${RULE}" stroke-width="1"/>`}
    pts.forEach((p,i)=>{s+=`<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="${PAPER}" stroke="${BLUE}" stroke-width="2"/>`+lbl(p[0],p[1]+4,"s"+(i+1),{size:10,color:BLUE})});
    return s;})()}
  ${lbl(270,250,"every neuron connects to every other — energy E descends to a stored pattern",{size:11,color:INK})}
`),

mlp: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map(i=>{const y=50+i*60;let s=`<circle cx="80" cy="${y}" r="13" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`;
    [0,1].map(j=>{const y2=80+j*100; s+=arrow(93,y,247,y2,RULE)});return s;}).join('')}
  ${[0,1].map(i=>{const y=80+i*100;let s=`<circle cx="260" cy="${y}" r="13" fill="${PAPER}" stroke="${BLUE}" stroke-width="1.6"/>`;
    [0,1,2].map(j=>{const y2=50+j*60; s+=arrow(273,y,437,y2,RULE)});return s;}).join('')}
  ${[0,1,2].map(i=>`<circle cx="450" cy="${50+i*60}" r="13" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`).join('')}
  ${[0,1].map(i=>`<circle cx="540" cy="${80+i*100}" r="13" fill="${PAPER}" stroke="${AMBER}" stroke-width="1.8"/>`).join('')}
  ${[0,1,2].map(i=>arrow(463,50+i*60,527,80+(i<1?0:1)*100,RULE)).join('')}
  ${lbl(80,210,"input",{size:10,color:RULE})}${lbl(260,210,"hidden",{size:10,color:RULE})}${lbl(450,210,"hidden",{size:10,color:RULE})}${lbl(540,210,"output",{size:10,color:RULE})}
  ${lbl(300,250,"hˡ = σ( Wˡ·hˡ⁻¹ + bˡ ),  backprop via chain rule",{size:11,mono:true})}
`),

cnn: ()=>svgWrap(`${ARROWDEF}
  ${lbl(80,40,"input image",{size:10,color:RULE})}
  <rect x="40" y="55" width="80" height="80" fill="none" stroke="${INK}" stroke-width="1.4"/>
  ${(()=>{let s='';for(let i=0;i<5;i++)for(let j=0;j<5;j++)s+=`<line x1="${40+i*16}" y1="55" x2="${40+i*16}" y2="135" stroke="${RULE}" stroke-width="0.5"/>`;return s;})()}
  <rect x="44" y="59" width="32" height="32" fill="none" stroke="${BLUE}" stroke-width="2"/>
  ${lbl(60,50,"kernel",{size:8,color:BLUE})}
  ${arrow(125,95,200,95,INK)}
  <rect x="200" y="65" width="60" height="60" fill="none" stroke="${BLUE}" stroke-width="1.6"/>
  ${lbl(230,55,"feature map",{size:9,color:RULE})}
  ${arrow(265,95,330,95,INK)}
  <rect x="330" y="75" width="40" height="40" fill="none" stroke="${INK}" stroke-width="1.4"/>
  ${lbl(350,135,"pool",{size:9,color:RULE})}
  ${arrow(375,95,440,95,INK)}
  <rect x="440" y="85" width="24" height="24" fill="none" stroke="${AMBER}" stroke-width="1.8"/>
  ${arrow(470,95,520,95,INK)}
  ${lbl(550,98,"⋯",{size:16})}
  ${lbl(300,190,"same kernel slides across all positions — shared weights, translation invariance",{size:11})}
  ${lbl(300,225,"(I * K)(x,y) = Σᵢ,ⱼ I(x+i,y+j)·K(i,j)",{size:11,mono:true})}
`),

svm: ()=>svgWrap(`${ARROWDEF}
  ${(()=>{let s='';const A=[[120,80],[160,60],[100,130],[150,150]],B=[[400,90],[450,70],[420,160],[470,140]];
    A.forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${BLUE}"/>`);
    B.forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${AMBER}"/>`);
    return s;})()}
  <line x1="220" y1="20" x2="340" y2="220" stroke="${INK}" stroke-width="2"/>
  <line x1="195" y1="20" x2="315" y2="220" stroke="${INK}" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="245" y1="20" x2="365" y2="220" stroke="${INK}" stroke-width="1" stroke-dasharray="4,4"/>
  ${lbl(280,30,"max margin",{size:10,color:RULE})}
  ${lbl(300,250,"hyperplane chosen to maximize distance to nearest points of either class",{size:11})}
`),

lstm: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="40" width="520" height="170" fill="none" stroke="${RULE}" stroke-width="1"/>
  ${lbl(60,60,"cₜ₋₁",{size:11,mono:true})}
  ${arrow(95,55,200,55,INK)}
  <circle cx="220" cy="55" r="14" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(220,59,"×",{size:14,color:BLUE})}
  ${arrow(234,55,330,55,INK)}
  <circle cx="350" cy="55" r="14" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(350,59,"+",{size:14,color:AMBER})}
  ${arrow(364,55,540,55,INK)}
  ${lbl(560,59,"cₜ",{size:11,mono:true})}
  ${arrow(220,69,220,110,RULE)}${lbl(220,128,"forget gate fₜ=σ(...)",{size:9,color:RULE})}
  ${arrow(350,69,350,110,RULE)}${lbl(350,128,"input gate ⊙ candidate",{size:9,color:RULE})}
  <rect x="180" y="150" width="80" height="34" fill="none" stroke="${INK}" stroke-width="1.2"/>${lbl(220,170,"σ gate",{size:10})}
  <rect x="310" y="150" width="80" height="34" fill="none" stroke="${INK}" stroke-width="1.2"/>${lbl(350,170,"σ,tanh",{size:10})}
  ${arrow(220,150,220,90,RULE)}${arrow(350,150,350,90,RULE)}
  ${lbl(220,210,"[hₜ₋₁, xₜ]",{size:10,mono:true,color:RULE})}${lbl(350,210,"[hₜ₋₁, xₜ]",{size:10,mono:true,color:RULE})}
  ${lbl(300,255,"additive cell update — cₜ = fₜ⊙cₜ₋₁ + iₜ⊙c̃ₜ — is what stops gradients vanishing",{size:11})}
`),

dbn: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map(layer=>{const y=190-layer*60;let s='';
    [0,1,2,3].map(i=>s+=`<circle cx="${150+i*100}" cy="${y}" r="11" fill="${layer%2==0?PAPER:BLUE}" stroke="${INK}" stroke-width="1.2"/>`);
    return s;}).join('')}
  ${lbl(80,190,"v (RBM1)",{size:10,color:RULE,anchor:"start"})}
  ${lbl(80,130,"h¹=v (RBM2)",{size:10,color:RULE,anchor:"start"})}
  ${lbl(80,70,"h²=v (RBM3)",{size:10,color:RULE,anchor:"start"})}
  ${arrow(150,178,150,142,RULE)}${arrow(150,118,150,82,RULE)}
  ${lbl(300,250,"each RBM pretrained greedily; its hidden layer becomes the next RBM's input",{size:11})}
`),

inception: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="120" width="60" height="40" fill="none" stroke="${INK}" stroke-width="1.4"/>${lbl(70,144,"input",{size:9})}
  ${[["1×1 conv",40],["3×3 conv",100],["5×5 conv",160],["pool",220]].map(([t,dy])=>`
    ${arrow(100,140,180,60+dy*0.3)}
    <rect x="180" y="${50+dy*0.3}" width="100" height="34" fill="none" stroke="${BLUE}" stroke-width="1.5"/>${lbl(230,71+dy*0.3,t,{size:10})}
    ${arrow(280,67+dy*0.3,420,140)}
  `).join('')}
  <rect x="420" y="120" width="70" height="40" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(455,144,"concat",{size:9})}
  ${lbl(300,250,"parallel filter sizes on the same input, concatenated — multi-scale features in one block",{size:11})}
`),

seq2seq: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map(i=>`<circle cx="${80+i*70}" cy="100" r="18" fill="${PAPER}" stroke="${BLUE}" stroke-width="1.6"/>${lbl(80+i*70,104,"h"+(i+1))}`).join('')}
  ${[0,1].map(i=>arrow(98+i*70,100,142+i*70,100,RULE)).join('')}
  ${arrow(220,100,300,100,INK)}
  <rect x="300" y="80" width="50" height="40" fill="none" stroke="${AMBER}" stroke-width="2"/>${lbl(325,104,"c",{size:14,color:AMBER})}
  ${lbl(325,135,"fixed vector",{size:9,color:RULE})}
  ${arrow(350,100,400,100,INK)}
  ${[0,1,2].map(i=>`<circle cx="${430+i*60}" cy="100" r="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>${lbl(430+i*60,104,"s"+(i+1))}`).join('')}
  ${[0,1].map(i=>arrow(448+i*60,100,412+(i+1)*60,100,RULE)).join('')}
  ${lbl(150,50,"ENCODER",{size:10,color:RULE})}${lbl(490,50,"DECODER",{size:10,color:RULE})}
  ${lbl(300,210,"entire input compressed into ONE fixed-length vector c — the bottleneck",{size:11})}
  ${lbl(300,240,"that attention (next) was built to remove",{size:11,color:AMBER})}
`),

gan: ()=>svgWrap(`${ARROWDEF}
  ${lbl(70,80,"z (noise)",{size:10,color:RULE})}
  <rect x="40" y="95" width="20" height="20" fill="${RULE}"/>
  ${arrow(60,105,140,105)}
  <rect x="140" y="80" width="90" height="50" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(185,109,"G",{size:18,color:BLUE})}
  ${arrow(230,105,310,105)}
  ${lbl(270,75,"fake x̂",{size:9,color:RULE})}
  <rect x="310" y="80" width="90" height="50" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(355,109,"D",{size:18,color:AMBER})}
  ${arrow(400,105,470,105)}${lbl(490,109,"real?",{size:10})}
  ${lbl(160,190,"real data x",{size:10,color:RULE})}
  <rect x="140" y="160" width="40" height="24" fill="${RULE}" opacity="0.4"/>
  ${arrow(180,172,310,130)}
  ${lbl(300,240,"minmax(G,D): G tries to fool D, D tries to catch G — adversarial equilibrium",{size:11})}
`),

vae: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="90" width="60" height="60" fill="none" stroke="${INK}" stroke-width="1.4"/>${lbl(70,124,"x",{size:14})}
  ${arrow(100,120,170,120)}
  <rect x="170" y="100" width="90" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(215,124,"encoder",{size:9})}
  ${arrow(260,110,330,90)}${arrow(260,130,330,150)}
  ${lbl(345,90,"μ",{size:14,color:AMBER})}${lbl(345,154,"σ",{size:14,color:AMBER})}
  <circle cx="400" cy="120" r="22" fill="none" stroke="${AMBER}" stroke-width="1.8" stroke-dasharray="3,2"/>${lbl(400,124,"z",{size:14,color:AMBER})}
  ${arrow(422,120,470,120)}
  <rect x="470" y="100" width="90" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(515,124,"decoder",{size:9})}
  ${lbl(300,230,"z = μ + σ⊙ε,  loss = reconstruction + KL(q(z|x) ‖ N(0,1))",{size:11,mono:true})}
`),

resnet: ()=>svgWrap(`${ARROWDEF}
  ${lbl(80,60,"x",{size:14})}
  ${arrow(100,65,180,65)}
  <rect x="180" y="45" width="120" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(240,69,"F(x, W)",{size:11,mono:true})}
  ${arrow(300,65,380,65)}
  <circle cx="400" cy="65" r="16" fill="none" stroke="${AMBER}" stroke-width="2"/>${lbl(400,70,"+",{size:16,color:AMBER})}
  ${arrow(416,65,480,65)}${lbl(500,69,"y",{size:14})}
  <path d="M90,65 C90,160 90,160 400,160 L400,81" fill="none" stroke="${AMBER}" stroke-width="1.8" marker-end="url(#arrowhead)"/>
  ${lbl(240,180,"identity skip connection",{size:10,color:AMBER})}
  ${lbl(300,240,"y = F(x,W) + x  —  the '+x' guarantees a direct gradient path at any depth",{size:11})}
`),

attention: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map(i=>`<circle cx="${100+i*100}" cy="60" r="16" fill="${PAPER}" stroke="${BLUE}" stroke-width="1.6"/>${lbl(100+i*100,64,"h"+(i+1))}`).join('')}
  <circle cx="300" cy="180" r="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.8"/>${lbl(300,184,"sₜ",{size:13})}
  ${[0,1,2].map(i=>arrow(100+i*100,76,290+(i-1)*8,164,i==1?AMBER:RULE)).join('')}
  ${lbl(120,110,"α₁",{size:10,color:RULE})}${lbl(300,110,"α₂ (highest weight)",{size:10,color:AMBER})}${lbl(420,110,"α₃",{size:10,color:RULE})}
  ${lbl(300,240,"cₜ = Σᵢ αₜ,ᵢ hᵢ  — a different weighted blend of ALL encoder states, computed fresh at each decoder step",{size:11})}
`),

unet: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2].map(i=>`<rect x="${60+i*40}" y="${50+i*30}" width="${100-i*20}" height="30" fill="none" stroke="${BLUE}" stroke-width="1.5"/>`).join('')}
  ${[0,1,2].map(i=>arrow(60+i*40+50-i*10,80+i*30,60+(i+1)*40+50-(i+1)*10,80+(i+1)*30)).join('')}
  ${[0,1,2].map(i=>`<rect x="${340-i*40}" y="${50+i*30}" width="${100-i*20}" height="30" fill="none" stroke="${AMBER}" stroke-width="1.5"/>`).join('')}
  ${[0,1].map(i=>arrow(340-(i+1)*40+50-(i+1)*10,80+(i+1)*30,340-i*40+50-i*10,80+i*30)).join('')}
  <rect x="180" y="140" width="40" height="30" fill="none" stroke="${INK}" stroke-width="1.4"/>${lbl(200,159,"·",{size:14})}
  ${arrow(140,140,180,150)}${arrow(220,150,260,140)}
  ${[0,1,2].map(i=>arrow(60+i*40+50-i*10,80+i*30+15,340-i*40+50-i*10,80+i*30+15,RULE,"3,3")).join('')}
  ${lbl(200,230,"skip connections (dashed) carry fine spatial detail straight across",{size:11})}
  ${lbl(200,255,"from each encoder stage to its mirrored decoder stage",{size:11})}
`),

transformer: ()=>svgWrap(`${ARROWDEF}
  ${lbl(90,40,"Q",{size:14,color:BLUE})}${lbl(220,40,"K",{size:14,color:BLUE})}${lbl(350,40,"V",{size:14,color:BLUE})}
  <rect x="60" y="50" width="60" height="26" fill="none" stroke="${BLUE}" stroke-width="1.5"/>
  <rect x="190" y="50" width="60" height="26" fill="none" stroke="${BLUE}" stroke-width="1.5"/>
  <rect x="320" y="50" width="60" height="26" fill="none" stroke="${BLUE}" stroke-width="1.5"/>
  ${arrow(90,76,200,120)}${arrow(220,76,200,120)}
  <rect x="150" y="120" width="100" height="30" fill="none" stroke="${INK}" stroke-width="1.6"/>${lbl(200,140,"QKᵗ/√d",{size:10,mono:true})}
  ${arrow(200,150,200,180)}
  <rect x="150" y="180" width="100" height="26" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(200,198,"softmax",{size:10})}
  ${arrow(250,193,330,193)}${arrow(350,76,350,180)}
  <rect x="330" y="180" width="60" height="26" fill="none" stroke="${INK}" stroke-width="1.6"/>${lbl(360,198,"× V",{size:10,mono:true})}
  ${arrow(390,193,460,193)}${lbl(490,198,"out",{size:11})}
  ${lbl(220,250,"Attention(Q,K,V) = softmax(QKᵗ/√dₖ)·V — every token attends to every token, in parallel",{size:11})}
`),

bert: ()=>svgWrap(`${ARROWDEF}
  ${["the","[MASK]","sat","on","[MASK]"].map((t,i)=>`<rect x="${60+i*100}" y="160" width="80" height="30" fill="${t.includes('MASK')?'none':PAPER}" stroke="${t.includes('MASK')?AMBER:RULE}" stroke-width="1.4" stroke-dasharray="${t.includes('MASK')?'4,3':'0'}"/>${lbl(100+i*100,180,t,{size:11,mono:true,color:t.includes('MASK')?AMBER:INK})}`).join('')}
  ${[0,1,2,3,4].map(i=>arrow(100+i*100,160,100+i*100,90,BLUE)).join('')}
  ${(()=>{let s='';for(let i=0;i<5;i++)for(let j=0;j<5;j++)if(i!==j)s+=`<line x1="${100+i*100}" y1="70" x2="${100+j*100}" y2="70" stroke="${RULE}" stroke-width="0.4"/>`;return s;})()}
  ${lbl(300,40,"bidirectional self-attention — every position sees both left and right context",{size:11,color:BLUE})}
  ${lbl(300,240,"predict the masked token from its full surrounding context, both directions",{size:11})}
`),

gpt: ()=>svgWrap(`${ARROWDEF}
  ${["the","cat","sat","on","?"].map((t,i)=>`<rect x="${60+i*100}" y="160" width="80" height="30" fill="${t=='?'?'none':PAPER}" stroke="${t=='?'?AMBER:RULE}" stroke-width="1.4" stroke-dasharray="${t=='?'?'4,3':'0'}"/>${lbl(100+i*100,180,t,{size:11,mono:true,color:t=='?'?AMBER:INK})}`).join('')}
  ${[0,1,2,3,4].map(i=>arrow(100+i*100,160,100+i*100,90,BLUE)).join('')}
  ${(()=>{let s='';for(let i=0;i<5;i++)for(let j=0;j<=i;j++)if(i!==j)s+=`<line x1="${100+i*100}" y1="70" x2="${100+j*100}" y2="70" stroke="${RULE}" stroke-width="0.5"/>`;return s;})()}
  ${lbl(300,40,"causal mask — each token only attends to itself and earlier tokens",{size:11,color:BLUE})}
  ${lbl(300,240,"generate next token, append it, repeat — autoregressive decoding",{size:11})}
`),

scaling: ()=>svgWrap(`${ARROWDEF}
  <line x1="60" y1="220" x2="540" y2="220" stroke="${INK}" stroke-width="1.4"/>
  <line x1="60" y1="220" x2="60" y2="40" stroke="${INK}" stroke-width="1.4"/>
  ${lbl(300,250,"compute / scale →",{size:10,color:RULE})}
  ${lbl(35,130,"loss",{size:10,color:RULE,anchor:"middle"})}
  <path d="M70,200 Q200,120 540,55" fill="none" stroke="${BLUE}" stroke-width="2"/>
  ${[100,220,340,460].map(x=>`<circle cx="${x}" cy="${200-((x-70)/470)*145+((x-70)/470)*((x-70)/470)*20}" r="4" fill="${AMBER}"/>`).join('')}
  ${lbl(300,30,"loss falls smoothly and predictably as a power law in compute/data/params",{size:11})}
`),

vit: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="40" width="160" height="160" fill="none" stroke="${INK}" stroke-width="1.4"/>
  ${(()=>{let s='';for(let i=1;i<4;i++){s+=`<line x1="${40+i*40}" y1="40" x2="${40+i*40}" y2="200" stroke="${RULE}" stroke-width="0.7"/>`;s+=`<line x1="40" y1="${40+i*40}" x2="200" y2="${40+i*40}" stroke="${RULE}" stroke-width="0.7"/>`}return s;})()}
  ${arrow(200,120,260,120)}
  ${["CLS","p1","p2","p3","p4"].map((t,i)=>`<rect x="${280+i*55}" y="105" width="45" height="30" fill="${t=='CLS'?AMBER:PAPER}" stroke="${t=='CLS'?AMBER:BLUE}" stroke-width="1.5"/>${lbl(302+i*55,124,t,{size:9,mono:true,color:t=='CLS'?'white':INK})}`).join('')}
  ${arrow(525,120,540,120)}
  ${lbl(300,40,"image → patches → flatten → linear projection → token sequence",{size:11})}
  ${lbl(300,230,"fed into a standard, unmodified Transformer encoder — no convolutions",{size:11})}
`),

diffusion: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2,3,4].map(i=>`<rect x="${50+i*110}" y="80" width="70" height="70" fill="none" stroke="${i==0?BLUE:(i==4?AMBER:RULE)}" stroke-width="1.6" opacity="${0.25+i*0.18}"/>`).join('')}
  ${[0,1,2,3].map(i=>arrow(120+i*110,115,160+i*110,115)).join('')}
  ${lbl(280,50,"forward: x₀ → x₁ → ⋯ → xT  (fixed gaussian noising)",{size:10,color:RULE})}
  ${[0,1,2,3].map(i=>arrow(450-i*110-10,170,490-i*110-110+40,170)).join('')}
  ${lbl(280,210,"reverse: xT → ⋯ → x̂₀  (learned denoising, εθ predicts the noise to remove)",{size:10,color:BLUE})}
  ${lbl(300,250,"loss = E[ ‖ε − εθ(xₜ,t)‖² ] — simple regression, no adversarial game",{size:11,mono:true})}
`),

clip: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="60" width="100" height="50" fill="none" stroke="${BLUE}" stroke-width="1.6"/>${lbl(90,89,"image enc.",{size:10})}
  <rect x="40" y="160" width="100" height="50" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(90,189,"text enc.",{size:10})}
  ${arrow(140,85,260,120)}${arrow(140,185,260,150)}
  <circle cx="320" cy="135" r="50" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3,3"/>
  ${lbl(320,90,"shared embedding space",{size:9,color:RULE})}
  ${[[300,120],[340,150],[310,150]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${BLUE}"/>`).join('')}
  ${[[305,125],[335,145]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${AMBER}"/>`).join('')}
  ${lbl(300,240,"matched (image,text) pairs pulled together, mismatched pairs pushed apart",{size:11})}
`),

moe: ()=>svgWrap(`${ARROWDEF}
  ${lbl(70,60,"token",{size:10,color:RULE})}
  <rect x="40" y="75" width="60" height="30" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
  ${arrow(100,90,180,90)}
  <rect x="180" y="70" width="70" height="40" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(215,94,"router",{size:9})}
  ${[0,1,2,3].map(i=>arrow(250,90,330,30+i*55,i==1?BLUE:RULE)).join('')}
  ${[0,1,2,3].map(i=>`<rect x="330" y="${15+i*55}" width="80" height="30" fill="${i==1?PAPER:'none'}" stroke="${i==1?BLUE:RULE}" stroke-width="${i==1?1.8:1}"/>${lbl(370,34+i*55,"expert "+(i+1),{size:9,color:i==1?BLUE:RULE})}`).join('')}
  ${arrow(410,45,480,90)}
  ${lbl(500,94,"out",{size:10})}
  ${lbl(300,250,"router sends each token to ONE expert — total params ↑, compute per token stays flat",{size:11})}
`),

swin: ()=>svgWrap(`${ARROWDEF}
  ${(()=>{let s='';for(let i=0;i<4;i++)for(let j=0;j<4;j++)s+=`<rect x="${60+i*50}" y="${40+j*50}" width="50" height="50" fill="none" stroke="${(i+j)%2==0?BLUE:RULE}" stroke-width="1.2"/>`;return s;})()}
  ${lbl(160,30,"windowed attention (layer L)",{size:10,color:BLUE})}
  ${arrow(280,140,340,140)}
  ${(()=>{let s='';for(let i=0;i<4;i++)for(let j=0;j<4;j++)s+=`<rect x="${360+i*50-25}" y="${40+j*50-25}" width="50" height="50" fill="none" stroke="${(i+j)%2==0?AMBER:RULE}" stroke-width="1.2"/>`;return s;})()}
  ${lbl(460,30,"shifted windows (layer L+1)",{size:10,color:AMBER})}
  ${lbl(300,250,"window grid shifts each layer, so info eventually crosses every boundary — O(n) not O(n²)",{size:11})}
`),

alphafold: ()=>svgWrap(`${ARROWDEF}
  <rect x="60" y="50" width="200" height="40" fill="none" stroke="${BLUE}" stroke-width="1.6"/>${lbl(160,74,"sequence representation",{size:10})}
  <rect x="60" y="160" width="200" height="80" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(160,204,"pair representation",{size:10})}
  ${arrow(160,90,160,158,RULE)}${arrow(160,158,160,90,RULE)}
  ${lbl(190,130,"cross-update",{size:9,color:RULE})}
  ${arrow(260,70,360,70)}
  <rect x="360" y="50" width="180" height="40" fill="none" stroke="${INK}" stroke-width="1.6"/>${lbl(450,74,"structure module",{size:10})}
  ${lbl(450,30,"→ 3D coordinates",{size:9,color:RULE})}
  ${lbl(300,250,"Evoformer alternates self-attention with explicit cross-talk between both representations",{size:11})}
`),

rag: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="90" width="90" height="40" fill="none" stroke="${INK}" stroke-width="1.5"/>${lbl(85,114,"query",{size:10})}
  ${arrow(130,110,200,110)}
  <rect x="200" y="60" width="100" height="100" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(250,40,"document index",{size:9,color:RULE})}
  ${[0,1,2].map(i=>`<rect x="215" y="${75+i*28}" width="70" height="20" fill="${i==1?PAPER:'none'}" stroke="${i==1?AMBER:RULE}" stroke-width="${i==1?1.6:1}"/>`).join('')}
  ${arrow(300,110,380,110)}
  <rect x="380" y="80" width="140" height="60" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(450,114,"generator (LLM)",{size:10})}
  ${arrow(520,110,560,110)}
  ${lbl(300,230,"retrieve top-k relevant docs first, then condition generation on query + retrieved text",{size:11})}
`),

rlhf: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="40" width="120" height="40" fill="none" stroke="${INK}" stroke-width="1.6"/>${lbl(100,64,"pretrained LM",{size:9})}
  ${arrow(100,80,100,120)}
  <rect x="40" y="120" width="120" height="40" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(100,144,"reward model",{size:9})}
  ${lbl(220,144,"trained on human preference pairs (yw ≻ yl)",{size:9,color:RULE,anchor:"start"})}
  ${arrow(100,160,100,200)}
  <rect x="40" y="200" width="120" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(100,224,"PPO fine-tune",{size:9})}
  ${lbl(220,224,"maximize reward, minus KL penalty vs. original",{size:9,color:RULE,anchor:"start"})}
  ${lbl(300,30,"two-stage: train a reward model, then RL-optimize the policy against it",{size:11})}
`),

ldm: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="90" width="80" height="80" fill="none" stroke="${INK}" stroke-width="1.4"/>${lbl(80,134,"pixel x",{size:9})}
  ${arrow(120,130,170,130)}
  <rect x="170" y="110" width="40" height="40" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(190,134,"z",{size:13,color:AMBER})}
  ${lbl(190,90,"VAE latent (8x smaller)",{size:8,color:RULE})}
  ${arrow(210,130,260,130)}
  ${(()=>{let s='';for(let i=0;i<3;i++)s+=`<rect x="${260+i*60}" y="115" width="30" height="30" fill="none" stroke="${BLUE}" stroke-width="1.4" opacity="${0.4+i*0.25}"/>`;return s;})()}
  ${lbl(330,90,"diffusion runs HERE",{size:9,color:BLUE})}
  ${arrow(450,130,500,130)}
  <rect x="500" y="110" width="40" height="40" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(520,134,"z'",{size:13,color:AMBER})}
  ${lbl(300,230,"diffusion never touches full pixels — only the small VAE latent — massive compute savings",{size:11})}
`),

flamingo: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="160" width="100" height="40" fill="none" stroke="${RULE}" stroke-width="1.4"/>${lbl(90,184,"vision enc. (frozen)",{size:8})}
  ${arrow(140,180,200,140)}
  <rect x="200" y="120" width="80" height="40" fill="none" stroke="${AMBER}" stroke-width="1.6"/>${lbl(240,144,"resampler",{size:9})}
  ${[0,1,2].map(i=>`<rect x="${50+i*100}" y="40" width="80" height="40" fill="none" stroke="${RULE}" stroke-width="1.4"/>${lbl(90+i*100,64,"LM layer (frozen)",{size:7})}`).join('')}
  ${[0,1].map(i=>`<rect x="${130+i*100}" y="40" width="40" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(150+i*100,64,"×attn",{size:7,color:BLUE})}`).join('')}
  ${arrow(280,140,150,80)}${arrow(280,140,250,80)}
  ${lbl(300,230,"new trainable cross-attention layers inserted between frozen LM layers, attending to visual tokens",{size:11})}
`),

sam: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="50" width="100" height="100" fill="none" stroke="${INK}" stroke-width="1.4"/>${lbl(90,160,"image",{size:9})}
  ${arrow(140,100,200,100)}
  <rect x="200" y="80" width="80" height="40" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(240,104,"image enc.",{size:9})}
  ${arrow(280,100,360,80)}
  <circle cx="100" cy="200" r="8" fill="${AMBER}"/>${lbl(100,225,"point prompt",{size:8,color:RULE})}
  ${arrow(110,195,360,120)}
  <rect x="360" y="70" width="100" height="60" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(410,104,"mask decoder",{size:9})}
  ${arrow(460,100,520,100)}${lbl(545,104,"mask",{size:10})}
  ${lbl(300,230,"expensive image encoding happens once; cheap prompt decoding runs per-prompt in ms",{size:11})}
`),

mamba: ()=>svgWrap(`${ARROWDEF}
  ${[0,1,2,3].map(i=>`<circle cx="${100+i*120}" cy="100" r="20" fill="none" stroke="${BLUE}" stroke-width="1.8"/>${lbl(100+i*120,104,"h"+i)}`).join('')}
  ${[0,1,2].map(i=>arrow(120+i*120,100,200+i*120,100)).join('')}
  ${[0,1,2,3].map(i=>`<rect x="${82+i*120}" y="150" width="36" height="24" fill="none" stroke="${AMBER}" stroke-width="1.4"/>${lbl(100+i*120,167,"A,B,C(x"+i+")",{size:7,color:AMBER})}`).join('')}
  ${[0,1,2,3].map(i=>arrow(100+i*120,148,100+i*120,128,RULE)).join('')}
  ${lbl(300,230,"hₜ = A(xₜ)hₜ₋₁ + B(xₜ)xₜ — A,B,C depend on the input, so the model selects what to remember",{size:11,mono:true})}
  ${lbl(300,205,"linear-time recurrence, computed via a parallel scan — not O(n²) attention",{size:10,color:RULE})}
`),

dpo: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="40" width="140" height="40" fill="none" stroke="${RULE}" stroke-width="1.4" stroke-dasharray="3,3"/>${lbl(110,64,"reward model (skipped)",{size:8,color:RULE})}
  <rect x="220" y="40" width="140" height="40" fill="none" stroke="${RULE}" stroke-width="1.4" stroke-dasharray="3,3"/>${lbl(290,64,"PPO / RL (skipped)",{size:8,color:RULE})}
  ${lbl(200,100,"↓ collapsed into ↓",{size:10,color:AMBER})}
  <rect x="120" y="140" width="280" height="60" fill="none" stroke="${BLUE}" stroke-width="2"/>${lbl(260,174,"single closed-form loss",{size:11,color:BLUE})}
  ${lbl(300,250,"directly on (preferred, rejected) pairs — standard supervised gradient descent, no RL loop",{size:11})}
`),

dit: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="60" width="60" height="60" fill="none" stroke="${RULE}" stroke-width="1.4"/>
  ${(()=>{let s='';for(let i=1;i<3;i++){s+=`<line x1="${40+i*20}" y1="60" x2="${40+i*20}" y2="120" stroke="${RULE}" stroke-width="0.6"/>`;s+=`<line x1="40" y1="${60+i*20}" x2="100" y2="${60+i*20}" stroke="${RULE}" stroke-width="0.6"/>`}return s;})()}
  ${arrow(100,90,160,90)}
  ${["t1","t2","t3"].map((t,i)=>`<rect x="${180+i*60}" y="75" width="50" height="30" fill="${PAPER}" stroke="${BLUE}" stroke-width="1.5"/>${lbl(205+i*60,94,t,{size:9,mono:true})}`).join('')}
  ${arrow(360,90,420,90)}
  <rect x="420" y="60" width="100" height="60" fill="none" stroke="${INK}" stroke-width="1.8"/>${lbl(470,84,"Transformer",{size:9})}${lbl(470,100,"blocks",{size:9})}
  ${lbl(300,160,"timestep/condition → adaptive layernorm",{size:9,color:AMBER})}
  ${arrow(300,145,470,122)}
  ${lbl(300,230,"diffusion's U-Net backbone replaced with a plain Transformer on image patches",{size:11})}
`),

mla: ()=>svgWrap(`${ARROWDEF}
  ${lbl(80,50,"token h",{size:10})}
  ${arrow(80,60,80,90)}
  <rect x="40" y="90" width="80" height="36" fill="none" stroke="${AMBER}" stroke-width="2"/>${lbl(80,112,"latent c",{size:10,color:AMBER})}
  ${lbl(80,145,"(tiny, cached)",{size:8,color:RULE})}
  ${arrow(120,108,220,80)}${arrow(120,108,220,130)}
  <rect x="220" y="65" width="70" height="30" fill="none" stroke="${BLUE}" stroke-width="1.5"/>${lbl(255,84,"reconstruct k",{size:8})}
  <rect x="220" y="115" width="70" height="30" fill="none" stroke="${BLUE}" stroke-width="1.5"/>${lbl(255,134,"reconstruct v",{size:8})}
  ${lbl(450,80,"vs. standard MHA:",{size:9,color:RULE,anchor:"start"})}
  <rect x="450" y="95" width="120" height="20" fill="none" stroke="${RULE}" stroke-width="1.2"/>${lbl(510,109,"full k,v cached/head",{size:8,color:RULE})}
  ${lbl(300,230,"only the small latent c is cached — k,v reconstructed on demand — huge KV-cache savings",{size:11})}
`),

reasoning: ()=>svgWrap(`${ARROWDEF}
  <rect x="40" y="90" width="100" height="40" fill="none" stroke="${INK}" stroke-width="1.6"/>${lbl(90,114,"problem",{size:10})}
  ${arrow(140,110,180,110)}
  <rect x="180" y="60" width="220" height="100" fill="none" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="4,3"/>${lbl(290,50,"internal reasoning tokens",{size:9,color:BLUE})}
  ${[0,1,2,3].map(i=>`<rect x="${195+i*50}" y="95" width="40" height="30" fill="none" stroke="${BLUE}" stroke-width="1.2"/>`).join('')}
  ${arrow(400,110,440,110)}
  <rect x="440" y="90" width="100" height="40" fill="none" stroke="${AMBER}" stroke-width="1.8"/>${lbl(490,114,"answer",{size:10,color:AMBER})}
  ${lbl(290,200,"more thinking tokens (more inference compute) → higher accuracy on hard problems",{size:11})}
  ${lbl(290,230,"trained via RL on verifiable correctness of the final answer",{size:11})}
`),

interaction: ()=>svgWrap(`${ARROWDEF}
  ${lbl(300,30,"continuous 200ms time-slices, processed in parallel",{size:10,color:RULE})}
  ${[0,1,2,3,4,5].map(i=>`<rect x="${60+i*80}" y="60" width="70" height="34" fill="${BLUE}" opacity="0.18" stroke="${BLUE}" stroke-width="1.4"/>`).join('')}
  ${lbl(95,82,"listen+speak",{size:7,color:BLUE,anchor:"start"})}
  ${[0,1,2,3,4,5].map(i=>`<rect x="${60+i*80}" y="120" width="70" height="34" fill="${AMBER}" opacity="0.15" stroke="${AMBER}" stroke-width="1.2"/>`).join('')}
  ${lbl(95,142,"interaction model",{size:7,color:AMBER,anchor:"start"})}
  <rect x="60" y="180" width="500" height="34" fill="none" stroke="${RULE}" stroke-width="1.2" stroke-dasharray="3,3"/>
  ${lbl(95,202,"background model (async reasoning, tool calls)",{size:8,color:RULE,anchor:"start"})}
  ${arrow(300,214,300,114,RULE,"2,2")}
  ${lbl(300,250,"no turn-taking — input/output streams run simultaneously, with a native clock per slice",{size:11})}
`)

};
