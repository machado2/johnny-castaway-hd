import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanPoseAlpha} from '../web/dist/whole-pose.js';

test('complete poses preserve every solid or antialiased visible pixel, without raising opacity',()=>{
  for(let alpha=0;alpha<=255;alpha++){
    const result=cleanPoseAlpha(alpha);
    assert(result<=alpha&&result>=0);
    if(alpha>=64)assert.equal(result,alpha,'visible body and prop pixels must never be cut');
    if(alpha<=12)assert.equal(result,0,'only faint fringes are discarded');
  }
});
