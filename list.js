// DiscoApp v1.07b — list.js
// - Grid meta now three-line: title, artist, years
// - List layout unchanged
// - Works with new CSS (.a line and truncation)

(function(){
  var D = window.DiscoApp;

  function setCount(start, end, total){
    var el=document.getElementById("count");
    if(!el) return;
    if(total===0){ el.textContent="0 of 0"; }
    else{ el.textContent=(start+1)+"-"+end+" of "+total; }
  }

  function ensureFade(img){
    if(!img) return;
    img.className += " img-fade";
    if(img.complete && img.naturalWidth){ img.className += " show"; }
    else { img.onload = function(){ img.className += " show"; }; }
  }

  function makeMetaLine(it){
    var yearStr = D.joinYearCountry(it.year, D.countryForItem(it));
    var masterStr = (it.master_year!=null) ? String(it.master_year) : "-";
    return (
      '<span class="s-year" title="Release year and country">'+D.escapeHtml(yearStr)+'</span>' +
      '<span class="s-mid">•</span>' +
      '<span class="s-master" title="Master release year">'+D.escapeHtml(masterStr)+'</span>'
    );
  }

  function render(){
    var grid=document.getElementById("grid");
    var list=document.getElementById("list");
    if(!grid || !list) return;
    grid.innerHTML=""; list.innerHTML="";

    var start=(D.page-1)*D.per;
    var end  = Math.min(start + D.per, D.filteredItems.length);
    var pageSlice=D.filteredItems.slice(start, end);

    if(D.view==="grid"){
      grid.style.display="flex"; list.style.display="none";
      for(var i=0;i<pageSlice.length;i++){
        var it=pageSlice[i];
        var card=document.createElement("div"); card.className="card";
        var inner=document.createElement("div"); inner.className="cardInner";
        var wrap=document.createElement("div"); wrap.className="artWrap";
        var img=document.createElement("img"); img.className="art"; img.alt=""; img.src=it.thumb||"";
        try{ img.decoding='async'; }catch(e){}
        try{ img.loading='lazy'; }catch(e){}
        ensureFade(img);
        wrap.appendChild(img);

        var meta=document.createElement("div"); meta.className="meta";

        // Album title
        var t=document.createElement("div"); t.className="t"; t.textContent=it.title;

        // NEW: Artist line
        var a=document.createElement("div"); a.className="a"; a.textContent=it.artist;

        // Year / Country / Master Year
        var s=document.createElement("div"); s.className="s";
        s.innerHTML = makeMetaLine(it);

        meta.appendChild(t);
        meta.appendChild(a);
        meta.appendChild(s);
        inner.appendChild(wrap);
        inner.appendChild(meta);
        card.appendChild(inner);
        (function(id){ card.addEventListener("click", function(){ D.openDetailsById(id); }); })(it.id);
        grid.appendChild(card);
      }
    }else{
      grid.style.display="none"; list.style.display="block";
      for(var j=0;j<pageSlice.length;j++){
        var it2=pageSlice[j];
        var li=document.createElement("li"); li.className="row";
        var tw=document.createElement("div"); tw.className="thumbWrap";
        var th=document.createElement("img"); th.className="thumb"; th.alt=""; th.src=it2.thumb||"";
        try{ th.decoding='async'; }catch(e){}
        try{ th.loading='lazy'; }catch(e){}
        ensureFade(th);
        tw.appendChild(th);

        var metaL=document.createElement("div"); metaL.className="metaL";
        var tL=document.createElement("div"); tL.className="tL"; tL.textContent=it2.title;

        var sL=document.createElement("div"); sL.className="sL";
        var p2 = D.escapeHtml(it2.artist) + ' <span class="s-mid">•</span> ' + makeMetaLine(it2) + (it2.catno ? ' <span class="s-mid">•</span> ' + D.escapeHtml(it2.catno) : '');
        sL.innerHTML=p2;

        metaL.appendChild(tL); metaL.appendChild(sL);
        li.appendChild(tw); li.appendChild(metaL);
        (function(id){ li.addEventListener("click", function(){ D.openDetailsById(id); }); })(it2.id);
        list.appendChild(li);
      }
    }

    var prev=document.getElementById("prev");
    var next=document.getElementById("next");
    if(prev) prev.disabled = D.page<=1;
    if(next) next.disabled = D.page>=D.pages;

    var toggle=document.getElementById("toggle");
    if(toggle) toggle.textContent = (D.view==="grid") ? "List View" : "Grid View";

    setCount(start, end, D.filteredItems.length);
  }

  function applyFilterAndPaginate(){
    var lc=String(D.q||"").toLowerCase();
    D.filteredItems=[];
    for(var i=0;i<D.allItems.length;i++){ if(D.matches(D.allItems[i], D.q)) D.filteredItems.push(D.allItems[i]); }

    D.pages=Math.max(1, Math.ceil(D.filteredItems.length / (D.per||1)));
    if(D.page>D.pages) D.page=D.pages;

    render();
    D.warmTrackIndexForQuery(lc);
  }
  D.applyFilterAndPaginate = applyFilterAndPaginate;
  D.render = render;

  function bindListControls(){
    var q=document.getElementById("q");
    if(q){ q.addEventListener("input", function(e){ D.q=e.target.value; D.page=1; applyFilterAndPaginate(); }); }

    var prev=document.getElementById("prev");
    if(prev){ prev.addEventListener("click", function(){ if(D.page>1){ D.page--; applyFilterAndPaginate(); } }); }

    var next=document.getElementById("next");
    if(next){ next.addEventListener("click", function(){ if(D.page<D.pages){ D.page++; applyFilterAndPaginate(); } }); }

    var random=document.getElementById("random");
    if(random){ random.addEventListener("click", D.openRandom); }

    var toggle=document.getElementById("toggle");
    if(toggle){
      toggle.addEventListener("click", function(){
        D.view=(D.view==="grid")?"list":"grid";
        try{ localStorage.setItem(D.VIEW_KEY, D.view); }catch(e){}
        render();
      });
    }

    var pageSize=document.getElementById("pageSize");
    if(pageSize){
      pageSize.value = String(D.per);
      pageSize.addEventListener("change", function(e){
        var v=parseInt(e.target.value,10);
        D.per = (!isNaN(v) && [25,50,100,250].indexOf(v)!==-1) ? v : 100;
        try{ localStorage.setItem(D.PER_KEY, String(D.per)); }catch(e){}
        D.page=1; applyFilterAndPaginate();
      });
    }
  }
  D.bindListControls = bindListControls;
})();
