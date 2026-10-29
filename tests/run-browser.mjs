import {spawn} from 'node:child_process'
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4190','--strictPort'],{stdio:'pipe',detached:true})
try {
 await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('127.0.0.1:4190'))resolve()});server.on('exit',code=>reject(Error(`Test server exited ${code}`)))})
 for (const suite of (process.env.REVIEWFIX2_ONLY ? ['tests/reviewfix2.mjs'] : ['tests/browser.mjs','tests/reviewfix2.mjs','tests/pending-revocation.mjs'])) await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[suite],{stdio:'inherit',env:{...process.env,RACE_BASE:'http://127.0.0.1:4190'}});child.on('exit',code=>code?reject(Error(`Browser suite exited ${code}`)):resolve())})
}finally{process.kill(-server.pid,'SIGTERM')}
