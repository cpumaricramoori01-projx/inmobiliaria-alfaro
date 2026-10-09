'use client';
// A password dialog, rather than a browser prompt, keeps the password masked.
export function reauthenticate(): Promise<void> {
  return new Promise((resolve,reject)=>{
    const dialog=document.createElement('dialog');
    dialog.className='w-[min(90vw,420px)] rounded-2xl border border-slate-200 p-6 shadow-xl';
    const form=document.createElement('form');
    const heading=document.createElement('h2');heading.textContent='Confirma tu identidad';heading.className='text-lg font-bold';
    const inputs: HTMLInputElement[]=[];
    for(const [title,name,type] of [['Tu contraseña','password','password']]) {
      const label=document.createElement('label');label.textContent=title;label.className='mt-4 block text-sm font-semibold';
      const input=document.createElement('input');input.name=name;input.type=type;input.required=true;input.maxLength=256;input.autocomplete='current-password';
      input.className='mt-2 w-full rounded-xl border border-slate-200 p-3';label.append(input);inputs.push(input);form.append(label);
    }
    form.prepend(heading);
    const error=document.createElement('p');error.setAttribute('role','alert');error.className='mt-3 text-sm text-red-700';form.append(error);
    const buttons=document.createElement('div');buttons.className='mt-5 flex gap-3';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.className='rounded-xl border border-slate-200 px-4 py-3';
    const submit=document.createElement('button');submit.type='submit';submit.textContent='Confirmar';submit.className='rounded-xl bg-red-700 px-4 py-3 text-white';buttons.append(cancel,submit);form.append(buttons);dialog.append(form);document.body.append(dialog);
    const cleanup=()=>{inputs.forEach(input=>input.value='');dialog.close();dialog.remove();};
    const abort=()=>{cleanup();reject(new Error('Confirmación cancelada.'));};
    cancel.onclick=abort;dialog.addEventListener('cancel',event=>{event.preventDefault();abort();});
    form.onsubmit=async event=>{
      event.preventDefault();if(submit.disabled)return;submit.disabled=true;cancel.disabled=true;
      try {
        const response=await fetch('/api/auth/reauth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:inputs[0].value})});
        const body=await response.json();if(!response.ok)throw new Error(body.error||'No se pudo confirmar.');cleanup();resolve();
      } catch(failure){error.textContent=failure instanceof Error?failure.message:'No se pudo confirmar.';inputs[0].value='';submit.disabled=false;cancel.disabled=false;inputs[0].focus();}
    };
    dialog.showModal();inputs[0].focus();
  });
}
