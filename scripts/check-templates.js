import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';

const root=path.resolve('views');
function visit(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())visit(full);
    else if(entry.isFile()&&entry.name.endsWith('.ejs'))ejs.compile(fs.readFileSync(full,'utf8'),{filename:full});
  }
}
visit(root);
for(const file of ['index.html','overview.html']){
  const html=fs.readFileSync(file,'utf8');
  const h1=(html.match(/<h1\b/gi)||[]).length;
  if(h1!==1)throw new Error(file+' must contain exactly one h1; found '+h1);
  if(!/<link\s+rel=["']canonical["']/i.test(html))throw new Error(file+' is missing its canonical link.');
  if(!/<meta\s+name=["']description["']/i.test(html))throw new Error(file+' is missing its meta description.');
  if(!/href=["']\/styles\.css["']/.test(html))throw new Error(file+' is missing its shared stylesheet.');
}
console.log('Templates and static-page metadata are valid.');
