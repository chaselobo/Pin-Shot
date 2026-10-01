const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// Presentation timeline: withdraw the one-piece gate pin, then drain the shot.
export function mechanismPose(progress) {
  const p=clamp(progress),pull=smooth(.04,.58,p),opening=clamp((pull*1.04-.108)/.444),drained=smooth(.15,.9,p)*opening;
  return {progress:p,pull,opening,drained,flow:opening>0&&drained<1,flap:smooth(.59,.72,p),
    phase:p<.04?'sealed':opening<=0?'withdrawing':drained<1?'draining':'mixed'};
}
