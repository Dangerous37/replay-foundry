export function evaluate({attempts,historicalGuard,recovery,selection}) {
  if(!Array.isArray(attempts)||!attempts.length||typeof historicalGuard!=='boolean'||
     !['blind','idempotent','reconcile'].includes(recovery)) throw Error('Invalid rehearsal configuration.');
  const seen=new Set(), operations=new Map();
  for(const a of attempts){
    if(typeof a.id!=='string'||!a.id||seen.has(a.id)||typeof a.key!=='string'||!a.key||
       !Number.isSafeInteger(a.units)||a.units<1||!['rejected','lost_ack','confirmed'].includes(a.outcome))
      throw Error('Invalid or duplicate attempt.');
    seen.add(a.id);
    const row=operations.get(a.key)??{key:a.key,units:a.units,effects:0,receipt:false,attempts:[]};
    if(row.units!==a.units)throw Error('Conflicting payload for '+a.key);
    if(a.outcome!=='rejected' && (!historicalGuard || row.effects===0)) row.effects++;
    if(a.outcome==='confirmed')row.receipt=true;
    row.attempts.push(a.outcome); operations.set(a.key,row);
  }
  if(selection!==undefined && (!Array.isArray(selection)||selection.some(k=>!operations.has(k))))throw Error('Unknown selected operation.');
  const rows=[];
  for(const row of operations.values()){
    let projected=row.effects, action='keep receipt';
    if(!row.receipt){
      if(selection && !selection.includes(row.key))action='excluded';
      else if(recovery==='reconcile' && row.effects>0) action='recover destination receipt';
      else if(recovery==='idempotent' && historicalGuard && row.effects>0)action='replay stored key';
      else {action='send again';projected++;}
    }
    const settled=row.receipt || action!=='excluded';
    const delta=(projected-1)*row.units;
    if(!Number.isSafeInteger(delta))throw Error('Unit total exceeds safe integer range.');
    rows.push({...row,action,projected,delta,settled});
  }
  return {decision:rows.every(r=>r.delta===0&&r.settled)?'ready':'blocked',rows};
}
