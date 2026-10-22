/* V16 text-only localization. Scene state and user artwork are never recreated. */
'use strict';(()=>{
  const dictionaries=[window.InkI18nMain,window.InkI18nDialogs],entries=dictionaries.flatMap(d=>d?.pairs||[]),english=new Map(entries);
  const key='ink-journey-language';let language='en';try{const saved=localStorage.getItem(key);if(saved==='en'||saved==='zh')language=saved;}catch{}
  const texts=new WeakMap(),attributes=new WeakMap(),htmlTexts=new WeakMap();
  const attributeNames=['aria-label','aria-valuetext','title','placeholder','alt'];
  function translate(source,lang=language){
    if(lang!=='en'||typeof source!=='string')return source;
    if(english.has(source))return english.get(source);
    const trim=source.trim();if(!trim)return source;
    let result=english.get(trim);
    if(result===undefined){
      let m=trim.match(/^邂逅\s*(\d+)\s*\/\s*(\d+)$/);if(m)result=`Discoveries ${m[1]} / ${m[2]}`;
      m=trim.match(/^(\d+)% · (.+)$/);if(m)result=`${m[1]}% · ${english.get(m[2])||m[2]}`;
      if(trim.startsWith('长卷新游 · '))result=(english.get('长卷新游 · ')||'Along the river · ')+(english.get(trim.slice(7))||trim.slice(7));
    }
    return result===undefined?source:source.replace(trim,result);
  }
  function ignored(node){const el=node.nodeType===1?node:node.parentElement;return !!el?.closest?.('script,style,[data-i18n-ignore],textarea');}
  function text(node){if(ignored(node))return;const current=node.nodeValue||'',old=texts.get(node),source=old&&current===old.last?old.source:current,value=translate(source);texts.set(node,{source,last:value});if(value!==current)node.nodeValue=value;}
  function attrs(el){if(ignored(el))return;let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}for(const name of attributeNames){if(!el.hasAttribute(name))continue;const current=el.getAttribute(name),old=saved[name],source=old&&current===old.last?old.source:current,value=translate(source);saved[name]={source,last:value};if(current!==value)el.setAttribute(name,value);}}
  function walk(node){if(!node||ignored(node))return;if(node.nodeType===1&&['scene-title','scene-poem','temple-title','brand-seal'].includes(node.id)){const current=node.innerHTML,old=htmlTexts.get(node),source=old&&current===old.last?old.source:current,value=translate(source);if(value!==current)node.innerHTML=value;htmlTexts.set(node,{source,last:node.innerHTML});if(english.has(source.trim()))return;}if(node.nodeType===3){text(node);return;}if(node.nodeType===1)attrs(node);for(const child of Array.from(node.childNodes||[]))walk(child);}
  function controls(){document.documentElement.lang=language==='en'?'en':'zh-CN';for(const el of document.querySelectorAll('[data-language]')){const selected=el.getAttribute('data-language')===language;el.setAttribute('aria-pressed',String(selected));el.classList.toggle('active',selected);}}
  function refresh(){walk(document.documentElement);const meta=document.querySelector('meta[name="description"]');if(meta){const current=meta.getAttribute('content'),old=attributes.get(meta)?.content,source=old&&current===old.last?old.source:current,value=translate(source);const record=attributes.get(meta)||{};record.content={source,last:value};attributes.set(meta,record);if(current!==value)meta.setAttribute('content',value);}controls();}
  function setLanguage(next){if(!['zh','en'].includes(next))return false;language=next;try{localStorage.setItem(key,next);}catch{}refresh();window.dispatchEvent(new CustomEvent('ink-language-change',{detail:{language:next}}));return true;}
  window.InkI18n={t:translate,setLanguage,refresh,get language(){return language;},get entries(){return entries.slice();}};
  for(const el of document.querySelectorAll('[data-language]'))el.addEventListener('click',()=>setLanguage(el.getAttribute('data-language')));
  if(typeof MutationObserver!=='undefined')new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')text(r.target);else if(r.type==='attributes')attrs(r.target);else walk(r.target);}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributeNames});
  refresh();
  document.documentElement.classList.remove('i18n-pending');
})();
