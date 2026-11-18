(()=>{
 const root=document.documentElement;
 root.dataset.theme='dark';root.style.colorScheme='dark';try{localStorage.removeItem('singlebook:theme')}catch{}
 // Reuse the existing page title nodes as fixed headers and scroll only their content window.
 root.style.setProperty('--cover-blur','0.75px');
 const app=document.getElementById('app');
 function layout(){
  if(document.querySelector('.phone').classList.contains('character-study'))return;
  const heading=app.querySelector(':scope > .prototype-heading, :scope > .simple-library-heading');
  if(!heading||app.querySelector(':scope > .fixed-page-content'))return;
  const body=document.createElement('div');body.className='fixed-page-content';
  while(heading.nextSibling)body.append(heading.nextSibling);
  app.append(body);
 }
 new MutationObserver(layout).observe(app,{childList:true});layout();
})();
