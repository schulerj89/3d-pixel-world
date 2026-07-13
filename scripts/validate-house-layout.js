#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const HouseSpaceSpec=require(path.join(root,"house-space-spec.js"));
const HouseLayout=require(path.join(root,"house-layout.js"));
const Validator=require(path.join(root,"house-layout-validator.js"));
const file=path.resolve(process.argv[2]||path.join(root,HouseSpaceSpec.LEVEL_FILE));

try{
 const level=HouseSpaceSpec.parseLevel(fs.readFileSync(file,"utf8"));
 const report=HouseSpaceSpec.validatePlan(level);
 const layout=HouseLayout.adaptLevel(level),geometry=Validator.validateWallGeometry(level,layout.walls);
 console.log(`house layout QA passed: ${path.basename(file)} (${report.metrics.width}x${report.metrics.depth}, ${report.metrics.rooms} rooms, ${report.metrics.doorRuns} entry runs, ${geometry.metrics.pieces} single-layer wall pieces, ${geometry.metrics.junctions} exact junctions)`);
}catch(error){
 console.error(error.message);
 process.exitCode=1;
}
