const recipes=window.RECIPES;
let selected=new Set(JSON.parse(localStorage.getItem("selectedMeals")||"[]")), buy=new Set(JSON.parse(localStorage.getItem("buyItems")||"[]")),filter="All",shopFilter="All";
const cats=["All","Chicken","Beef","Fish","Pork","Lamb","Vegetarian","Quick ≤ 30 mins"], grid=document.querySelector("#grid"),filters=document.querySelector("#filters"),search=document.querySelector("#search");
function toast(s){const t=document.querySelector("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
function rf(){filters.innerHTML=cats.map(c=>`<button class="chip ${c===filter?"active":""}" data-c="${c}">${c}</button>`).join("");filters.querySelectorAll("button").forEach(b=>b.onclick=()=>{filter=b.dataset.c;rf();renderMeals()})}
function match(r){const q=search.value.trim().toLowerCase(),f=filter==="All"||r.category===filter||(filter.startsWith("Quick")&&r.minutes<=30);return f&&(!q||(r.name+" "+r.style+" "+r.description).toLowerCase().includes(q))}
function renderMeals(){grid.innerHTML=recipes.filter(match).map(r=>`<article class="card ${selected.has(r.id)?"selected":""}" data-id="${r.id}"><div class="photo" style="background-image:url('${r.id}.webp')"><span class="dish">${r.style}</span><span class="select">${selected.has(r.id)?"✓":""}</span></div><div class="body"><div class="name">${r.name}</div><div class="desc">${r.description}</div><div class="meta"><span>◷ ${r.time}</span><span>🍴 ${r.category}</span></div></div></article>`).join("");grid.querySelectorAll(".card").forEach(c=>c.onclick=()=>{selected.has(c.dataset.id)?selected.delete(c.dataset.id):selected.add(c.dataset.id);localStorage.setItem("selectedMeals",JSON.stringify([...selected]));renderMeals()});document.querySelector("#count").textContent=`${selected.size} meal${selected.size===1?"":"s"} selected`}
function ingredientRows(){let rows=[];recipes.filter(r=>selected.has(r.id)).forEach(r=>r.ingredients.forEach(i=>{let key=r.id+"|"+i.order;rows.push({...i,key,meal:r.name})}));return rows}
function renderShopping(){let rows=ingredientRows(), needed=rows.filter(x=>buy.has(x.key)).length;document.querySelector("#shopFilters").innerHTML=[["All",rows.length],["To buy",needed],["Not needed",rows.length-needed]].map(([x,n])=>`<button class="${shopFilter===x?"active":""}" data-f="${x}">${x} (${n})</button>`).join("");document.querySelectorAll("#shopFilters button").forEach(b=>b.onclick=()=>{shopFilter=b.dataset.f;renderShopping()});if(shopFilter==="To buy")rows=rows.filter(x=>buy.has(x.key));if(shopFilter==="Not needed")rows=rows.filter(x=>!buy.has(x.key));let groups={};rows.forEach(x=>(groups[x.category]??=[]).push(x));let order=["Meat & Fish","Dairy & Eggs","Fruit & Vegetables","Bakery","Store Cupboard"];document.querySelector("#shoppingList").innerHTML=order.filter(g=>groups[g]?.length).map(g=>`<section class="shopgroup"><h2>${g}</h2><div class="shopitems">${groups[g].map(x=>`<label class="shoprow"><input type="checkbox" data-key="${x.key}" ${buy.has(x.key)?"checked":""}><span>${x.item}<span class="sources">${x.meal}</span></span><span class="amount">${x.amount??""}</span></label>`).join("")}</div></section>`).join("")||`<div class="shopgroup"><p>No ingredients to show. Select meals first.</p></div>`;document.querySelectorAll(".shoprow input").forEach(c=>c.onchange=()=>{c.checked?buy.add(c.dataset.key):buy.delete(c.dataset.key);localStorage.setItem("buyItems",JSON.stringify([...buy]));renderShopping()});document.querySelector("#buyCount").textContent=`${needed} item${needed===1?"":"s"} selected`}
function showPage(p){
 const isMeals=p==="meals",isShop=p==="shopping",isCook=p==="cook";
 document.querySelector("#mealsPage").classList.toggle("hidden",!isMeals);
 document.querySelector("#shoppingPage").classList.toggle("hidden",!isShop);
 document.querySelector("#cookPage").classList.toggle("hidden",!isCook);
 document.querySelector("#selectionBar").classList.toggle("hidden",!isMeals);
 document.querySelector("#shopBar").classList.toggle("hidden",!isShop);
 ["mealsNav","shoppingNav","cookNav"].forEach(id=>document.querySelector("#"+id).classList.remove("active"));
 document.querySelector("#"+p+"Nav").classList.add("active");
 if(isShop)renderShopping(); if(isCook)renderCookPicker(); window.scrollTo(0,0)
}
function keepList(){const rows=ingredientRows().filter(x=>buy.has(x.key));return rows.map(x=>`${x.item}${x.amount?" — "+x.amount:""}`).join("\n")}
search.oninput=renderMeals;document.querySelector("#create").onclick=()=>{if(!selected.size)return toast("Select at least one meal first");showPage("shopping")};document.querySelector("#mealsNav").onclick=()=>showPage("meals");document.querySelector("#shoppingNav").onclick=()=>showPage("shopping");document.querySelector("#cookNav").onclick=()=>showPage("cook");
document.querySelector("#clearBuy").onclick=()=>{buy.clear();localStorage.setItem("buyItems","[]");renderShopping()};
document.querySelector("#prepareKeep").onclick=()=>{const s=keepList();if(!s)return toast("Tick the ingredients you need first");document.querySelector("#keepText").value=s;document.querySelector("#keepBox").classList.remove("hidden");document.querySelector("#keepBox").scrollIntoView({behavior:"smooth"})};
document.querySelector("#copyKeep").onclick=async()=>{await navigator.clipboard.writeText(document.querySelector("#keepText").value);toast("Shopping list copied")};
document.querySelector("#shareKeep").onclick=async()=>{const text=document.querySelector("#keepText").value;if(navigator.share)try{await navigator.share({title:"Shopping list",text})}catch(e){}else{await navigator.clipboard.writeText(text);toast("Copied — paste into Google Keep")}};
rf();renderMeals();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
let currentCook=localStorage.getItem("currentCook")||"",wakeLock=null;
function selectedRecipes(){return recipes.filter(r=>selected.has(r.id))}
function renderCookPicker(){
 const rs=selectedRecipes(),sel=document.querySelector("#cookMealSelect"),empty=document.querySelector("#cookEmpty"),view=document.querySelector("#recipeView");
 if(!rs.length){sel.innerHTML="<option>No meals selected</option>";empty.classList.remove("hidden");view.classList.add("hidden");return}
 empty.classList.add("hidden");view.classList.remove("hidden");
 if(!rs.some(r=>r.id===currentCook))currentCook=rs[0].id;
 sel.innerHTML=rs.map(r=>`<option value="${r.id}" ${r.id===currentCook?"selected":""}>${r.name}</option>`).join("");
 sel.onchange=()=>{currentCook=sel.value;localStorage.setItem("currentCook",currentCook);renderRecipe()};
 renderRecipe()
}
function renderRecipe(){
 const r=recipes.find(x=>x.id===currentCook);if(!r)return;
 document.querySelector("#cookTitle").textContent=r.name;document.querySelector("#cookStyle").textContent=r.style;document.querySelector(".recipehero").style.backgroundImage=`linear-gradient(0deg,rgba(10,30,23,.72),rgba(10,30,23,.05) 70%),url('${r.id}.webp')`;
 document.querySelector("#cookTime").textContent="◷ "+r.time;document.querySelector("#cookCategory").textContent=r.category;
 const checked=new Set(JSON.parse(localStorage.getItem("cookChecked:"+r.id)||"[]"));
 document.querySelector("#cookIngredients").innerHTML=r.ingredients.map(i=>`<label class="ingredientline"><input type="checkbox" data-o="${i.order}" ${checked.has(String(i.order))?"checked":""}><span>${i.item}</span><span class="amount">${i.amount??""}</span></label>`).join("");
 document.querySelectorAll("#cookIngredients input").forEach(c=>c.onchange=()=>{c.checked?checked.add(c.dataset.o):checked.delete(c.dataset.o);localStorage.setItem("cookChecked:"+r.id,JSON.stringify([...checked]))});
 document.querySelector("#cookMethod").innerHTML=r.method.map((s,n)=>`<div class="methodstep"><span class="stepnum">${n+1}</span><span>${s.text}</span></div>`).join("");
}
function cookTab(which){
 const ing=which==="ingredients";document.querySelector("#cookIngredients").classList.toggle("hidden",!ing);document.querySelector("#cookMethod").classList.toggle("hidden",ing);
 document.querySelector("#ingredientsTab").classList.toggle("active",ing);document.querySelector("#methodTab").classList.toggle("active",!ing)
}
document.querySelector("#ingredientsTab").onclick=()=>cookTab("ingredients");document.querySelector("#methodTab").onclick=()=>cookTab("method");
document.querySelector("#wakeButton").onclick=async()=>{
 const b=document.querySelector("#wakeButton"),s=document.querySelector("#wakeStatus");
 if(wakeLock){try{await wakeLock.release()}catch(e){}wakeLock=null;b.classList.remove("active");b.textContent="Start cooking · keep screen on";s.textContent="";return}
 if(!("wakeLock" in navigator)){s.textContent="This browser does not support keeping the screen awake automatically.";return}
 try{wakeLock=await navigator.wakeLock.request("screen");b.classList.add("active");b.textContent="Cooking mode on · allow screen to sleep";s.textContent="Screen will stay awake while Meal Planner remains visible.";wakeLock.addEventListener("release",()=>{wakeLock=null;b.classList.remove("active");b.textContent="Start cooking · keep screen on"})}
 catch(e){s.textContent="Screen-awake permission was not available. Your normal screen timeout will apply."}
};
document.addEventListener("visibilitychange",async()=>{if(document.visibilityState==="visible"&&document.querySelector("#wakeButton").classList.contains("active")&&!wakeLock&&"wakeLock"in navigator)try{wakeLock=await navigator.wakeLock.request("screen")}catch(e){}});
