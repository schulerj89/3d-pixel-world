#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const HouseSpaceSpec=require(path.join(root,"house-space-spec.js"));
const file=path.resolve(process.argv[2]||path.join(root,HouseSpaceSpec.LEVEL_FILE));

try{
 const level=HouseSpaceSpec.parseLevel(fs.readFileSync(file,"utf8"));
 const report=HouseSpaceSpec.validatePlan(level);
 console.log(`house layout QA passed: ${path.basename(file)} (${report.metrics.width}x${report.metrics.depth}, ${report.metrics.rooms} rooms, ${report.metrics.doorRuns} entry runs)`);
}catch(error){
 console.error(error.message);
 process.exitCode=1;
}
