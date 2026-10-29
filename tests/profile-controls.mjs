// Open the actual sentence chip before interacting with its visible editor.
export async function field(page,label) {
 const chip = label === 'Name' ? 'name' : label === 'Age' ? 'age' : label.startsWith('Height') ? 'height' : label.startsWith('Actual') ? 'current weight' : 'goal weight'
 const input=page.getByLabel(label,{exact:label==='Name' || label==='Age'}).and(page.locator('input'))
 if (!await input.count()) await page.getByRole('button',{name:`Edit ${chip}`,exact:true}).click()
 return input
}
export async function fill(page,label,value) {await (await field(page,label)).fill(value)}
export async function units(page,value) {
 await page.getByRole('button',{name:'Edit units',exact:true}).click()
 await page.getByRole('button',{name:value==='metric'?'Metric':'Imperial',exact:true}).click()
 await page.getByRole('button',{name:'Close',exact:true}).click()
}
