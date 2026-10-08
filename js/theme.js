/* Apply the saved choice before the first paint; dark remains the default. */
(function(){
 function apply(value){const theme=value==='light'?'light':'dark';document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#ffffff':'#070a12');document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.textContent=theme==='dark'?'☀ Light mode':'☾ Dark mode';button.setAttribute('aria-label','Switch to '+(theme==='dark'?'light':'dark')+' mode');button.setAttribute('aria-pressed',String(theme==='light'))})}
 let saved;try{saved=localStorage.getItem('apg_theme')}catch{}apply(saved);
 window.APGTheme={apply,toggle(){const next=document.documentElement.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('apg_theme',next)}catch{}apply(next)}};
 addEventListener('storage',event=>{if(event.key==='apg_theme')apply(event.newValue)});
})();
