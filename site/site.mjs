const families={
  guitars:{kicker:'YOUR FIRST CHORD',title:'Nylon Acoustic',description:'Warm nylon strings and a gentle attack. Starts in Strum mode: hold a black chord key and the rhythm comes to you.',list:'Nylon · Steel · Jumbo · Palm-muted · Clean · Jazz'},
  strings:{kicker:'TAKE THE SCENIC ROUTE',title:'A harp. A bow. A new idea.',description:'Let harp notes tumble, lean into a violin-like sustain, or find a low cello or bass line. The key mapping adapts to each instrument’s chord parts and register.',list:'Harp · Bowed Violin · Pizzicato Cello · Bass · Dulcimer'},
  glow:{kicker:'TURN UP THE CHARACTER',title:'From a clean chime to a growl.',description:'Explore Wood, Wire and Glow, or reach for the crunch and heavy guitar colours. Intensity starts at 60%: soften it to the left, bring out the edge to the right.',list:'Wood · Wire · Glow · Crunch · Heavy guitar'}
};
const tabs=[...document.querySelectorAll('[data-family]')];
function select(tab){
  const data=families[tab.dataset.family];
  for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;}
  document.getElementById('sound-panel').setAttribute('aria-labelledby',tab.id);
  for(const [key,value] of Object.entries(data))document.getElementById(`sound-${key}`).textContent=value;
}
for(const tab of tabs){
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',event=>{
    const index=tabs.indexOf(tab);let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();select(tabs[next]);tabs[next].focus();}
  });
}
