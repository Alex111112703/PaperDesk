(() => {
const assets={
 BTC:{name:"Bitcoin",price:67250},
 ETH:{name:"Ethereum",price:2480},
 SOL:{name:"Solana",price:152},
 DOGE:{name:"Dogecoin",price:.118},
 PEPE:{name:"Pepe",price:.0000098},
 BONK:{name:"Bonk",price:.0000142}
};
const key="fomodesk-paper-v1";
let state=JSON.parse(localStorage.getItem(key)||"null")||{cash:100000,positions:{},history:[]};
let selected="BTC", prices=Object.fromEntries(Object.entries(assets).map(([s,a])=>[s,a.price]));
let series={}; for(const s in assets) series[s]=Array.from({length:55},()=>prices[s]*(.985+Math.random()*.03));
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n)}
function save(){localStorage.setItem(key,JSON.stringify(state))}
function tick(){
 for(const s in prices){const drift=(Math.random()-.495)*.006;prices[s]*=1+drift;series[s].push(prices[s]);if(series[s].length>70)series[s].shift()}
 document.getElementById("price").value=prices[selected].toFixed(selected==="PEPE"||selected==="BONK"?8:2);
 render(); draw();
}
function select(s){selected=s;document.getElementById("assetName").textContent=assets[s].name;document.getElementById("assetSymbol").textContent=s;document.getElementById("price").value=prices[s];render();draw()}
function order(side){
 const p=Number(document.getElementById("price").value), q=Number(document.getElementById("qty").value), total=p*q;
 if(!Number.isFinite(p)||p<=0||!Number.isFinite(q)||q<=0)return alert("Enter a valid price and quantity.");
 const pos=state.positions[selected]||{qty:0,avg:0};
 if(side==="buy"){
   if(total>state.cash)return alert("Not enough virtual USD.");
   pos.avg=(pos.avg*pos.qty+p*q)/(pos.qty+q);pos.qty+=q;state.cash-=total;
 }else{
   if(q>pos.qty+1e-12)return alert("You cannot sell more than your paper position.");
   state.cash+=total;pos.qty-=q;if(pos.qty<1e-12)pos.qty=0;
   if(!pos.qty)pos.avg=0;
 }
 state.positions[selected]=pos;
 state.history.unshift({side,sym:selected,q,p,time:new Date().toLocaleString()});
 state.history=state.history.slice(0,100);save();document.getElementById("qty").value="";render();
}
function render(){
 const holdings=Object.entries(state.positions).reduce((n,[s,p])=>n+p.qty*prices[s],0), value=state.cash+holdings;
 const invested=Object.entries(state.positions).reduce((n,[s,p])=>n+p.qty*p.avg,0);
 const pnl=value-100000;
 for(const id of ["portfolio"])document.getElementById(id).textContent=money(value);
 document.getElementById("cash").textContent=money(state.cash);document.getElementById("cash2").textContent=money(state.cash);
 const pe=document.getElementById("pnl");pe.textContent=money(pnl);pe.className="value "+(pnl>=0?"up":"down");
 document.getElementById("watchlist").innerHTML=Object.entries(assets).map(([s,a])=>`<button class="coin ${s===selected?"active":""}" data-s="${s}"><div><div class="name">${a.name}</div><div class="sym">${s}</div></div><div class="price">${prices[s]<.001?prices[s].toFixed(8):money(prices[s])}<br><span class="${series[s].at(-1)>=series[s][0]?"up":"down"}">${((prices[s]/series[s][0]-1)*100).toFixed(2)}%</span></div></button>`).join("");
 document.querySelectorAll(".coin").forEach(b=>b.onclick=()=>select(b.dataset.s));
 document.getElementById("positions").innerHTML=Object.entries(state.positions).filter(([s,p])=>p.qty>0).map(([s,p])=>`<div class="position"><span><b>${s}</b><br><small>${p.qty} @ ${money(p.avg)}</small></span><span>${money(p.qty*prices[s])}<br><small class="${prices[s]>=p.avg?"up":"down"}">${money((prices[s]-p.avg)*p.qty)}</small></span></div>`).join("")||'<div class="empty">No open paper positions.</div>';
 document.getElementById("history").innerHTML=state.history.map(t=>`<div class="trade-item"><span><b class="${t.side==="buy"?"up":"down"}">${t.side.toUpperCase()} ${t.sym}</b><br>${t.q} @ ${money(t.p)}</span><span>${money(t.q*t.p)}<br><small>${t.time}</small></span></div>`).join("")||'<div class="empty">Your paper trades will appear here.</div>';
 const pos=state.positions[selected];document.getElementById("orderHint").textContent=`Paper ${selected} position: ${pos?.qty||0} • Estimated value: ${money((pos?.qty||0)*prices[selected])}`;
}
function draw(){
 const c=document.getElementById("chart"),r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=r.height*d;const x=c.getContext("2d");x.scale(d,d);
 const w=r.width,h=r.height,pad=18,data=series[selected],mn=Math.min(...data),mx=Math.max(...data),span=mx-mn||1;
 x.strokeStyle="#242a38";x.lineWidth=1;for(let i=1;i<5;i++){const y=pad+(h-pad*2)*i/5;x.beginPath();x.moveTo(pad,y);x.lineTo(w-pad,y);x.stroke()}
 x.strokeStyle="#8c7cff";x.lineWidth=2;x.beginPath();data.forEach((v,i)=>{const px=pad+(w-pad*2)*i/(data.length-1),py=h-pad-(v-mn)/span*(h-pad*2);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
}
document.getElementById("buy").onclick=()=>order("buy");document.getElementById("sell").onclick=()=>order("sell");
document.getElementById("reset").onclick=()=>{if(confirm("Reset all paper trades and return to $100,000?")){state={cash:100000,positions:{},history:[]};save();render()}};
window.addEventListener("resize",draw);render();draw();setInterval(tick,3000);
})();