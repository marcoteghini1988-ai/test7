import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

// A green combat suite does not execute React's animation effects. Check
// their real bindings too: an absent import must not crash the live canvas.
test('Live weapon renderers contain no unbound identifiers',()=>{
 const files=['CinematicWeaponEffects.jsx','MaglioBattleEffects.jsx','MaglioProjectileScene.jsx',
  'MetalWeaponProjectileScene.jsx','MagneticWeaponEffects.jsx','PrecisionWeaponEffects.jsx',
  'WeaponSalvoCardMarks.jsx','WeaponCardInteractions.jsx','IonicWeaponProjectileScene.jsx',
  'approvedProjectileEffects.js','ionicWeaponBattleVisuals.js','ionicWeaponSounds.js',
  'weaponKinematics.js','weaponCinematicRenderer.js',
  'weaponCinematicStyle.js','weaponHullImpacts.js','weaponSalvoAudio.js','maglioPerspectiveRenderer.js',
  'metalWeaponSounds.js','weaponHaptics.js','CoreThunderCardState.jsx','coreThunderRenderer.js',
  'coreThunderAudio.js','coreThunderBattleVisuals.js','coreThunderSpec.js','CardTextLayer.jsx',
  'cardTextPresentation.js','cardTextLocale.js','cardTextDom.js','cardTextAssets.js',
  'probeHammerSpec.js','probeHammerRenderer.js','probeHammerAudio.js','probeHammerMarks.js',
  'ProbeHammerMarks.jsx','probeHammerCardText.js','commandLanceSpec.js','commandLanceRenderer.js','commandLanceAudio.js','commandLanceCardText.js'].map(p=>'src/'+p);
 const program=ts.createProgram(files,{allowJs:true,checkJs:true,noEmit:true,skipLibCheck:true,
  target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
  jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2023.d.ts','lib.dom.d.ts'],allowSyntheticDefaultImports:true});
 const errors=files.flatMap(file=>program.getSemanticDiagnostics(program.getSourceFile(file)))
  .filter(d=>[2304,2552].includes(d.code));
 assert.equal(errors.length,0,ts.formatDiagnosticsWithColorAndContext(errors,{
  getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:p=>p,getNewLine:()=> '\n'}));
});
