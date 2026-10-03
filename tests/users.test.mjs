import test from 'node:test';
import assert from 'node:assert/strict';
import { userInput, assertUserAccessChange } from '../lib/user-input.mjs';
const form = { nombre: ' Ana Pérez ', usuario: ' ANA.PEREZ ', email: '', rol: 'operador', activo: true, password: 'abcdefgh', confirmacion: 'abcdefgh' };
test('users require consistent identity, explicit privileges and confirmed passwords of at least eight characters', () => {
  const input=userInput(form,true);assert.equal(input.nombre,'Ana Pérez');assert.equal(input.usuario,'ana.perez');assert.equal(input.email,'ana.perez@inmobiliaria-alfaro.local');
  for(const body of [null,[],{...form,rol:'superadmin'},{...form,activo:'true'},{...form,email:'invalid'},{...form,usuario:'a b'},{...form,password:'abcdefg',confirmacion:'abcdefg'},{...form,confirmacion:'other123'},{...form,nombre:'x'.repeat(121)},{...form,desbloquear:'true'}])assert.throws(()=>userInput(body,true));
  const editing=userInput({...form,password:'',confirmacion:''});assert.equal(editing.password,null);assert.throws(()=>userInput({...form,password:'',confirmacion:''},true));
});
test('only active administrators may mutate accounts, and administrator access cannot be lost', () => {
  const actor={id:1,rol:'administrador',activo:true};
  const target={id:2,rol:'administrador',activo:true};
  assert.throws(()=>assertUserAccessChange({...actor,rol:'operador'},target,form,2));
  assert.throws(()=>assertUserAccessChange({...actor,activo:false},target,form,2));
  assert.throws(()=>assertUserAccessChange(actor,actor,{...form,rol:'administrador',activo:false},2));
  assert.throws(()=>assertUserAccessChange(actor,actor,form,2));
  assert.throws(()=>assertUserAccessChange(actor,target,form,1));
  assert.doesNotThrow(()=>assertUserAccessChange(actor,target,form,2));
  assert.doesNotThrow(()=>assertUserAccessChange(actor,actor,{...form,rol:'administrador'},1));
});
