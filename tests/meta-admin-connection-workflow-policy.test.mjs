import test from 'node:test'
import assert from 'node:assert/strict'
import {validateWorkflowMutation as verify} from '../lib/meta-admin/connection-workflow-policy.mjs'
const identity={organizationId:'55555555-5555-4555-8555-555555555555',protocolId:'77777777-7777-4777-8777-777777777777',actorId:'233162528',currentStage:'received',expectedVersion:1}
test('accepts stage, operator and notes with strict input contract',()=>{
 assert.equal(verify({...identity,action:'stage_change',payload:{stage:'under_review'}}).action,'stage_change')
 assert.equal(verify({...identity,action:'assign',payload:{operatorId:'233162528'}}).action,'assign')
 assert.equal(verify({...identity,action:'note',payload:{text:'Solicitar autorização do responsável.'}}).action,'note')
})
test('prevents arbitrary state, unexpected fields, cross-identity and UI-driven activation',()=>{
 for(const x of [
  {...identity,action:'stage_change',payload:{stage:'active'}},
  {...identity,currentStage:'operational_validation',action:'stage_change',payload:{stage:'active'}},
  {...identity,action:'stage_change',payload:{stage:'completed'}},
  {...identity,action:'assign',payload:{operatorId:'1',isAdmin:true}},
  {...identity,actorId:'../../admin',action:'note',payload:{text:'ok'}},
  {...identity,organizationId:'other',action:'note',payload:{text:'ok'}},
  {...identity,action:'note',payload:{text:''}},
  {...identity,expectedVersion:0,action:'note',payload:{text:'ok'}}
 ])assert.throws(()=>verify(x))
})
