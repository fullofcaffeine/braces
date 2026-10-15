const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const mode = process.argv[3];
if (mode) {
  const braces = require(target);
  const [api, shape] = mode.split(':');
  if (shape === 'normal') {
    assert.deepEqual(braces.expand('release-{1..3}/{stable,beta}'), [
      'release-1/stable', 'release-1/beta', 'release-2/stable',
      'release-2/beta', 'release-3/stable', 'release-3/beta'
    ]);
    assert.equal(braces.compile('feat/{core,ui}'), 'feat/(core|ui)');
    assert.equal(braces.stringify(braces.parse('feat/{core,ui}')), 'feat/{core,ui}');
    process.exit(0);
  }
  let input;
  if (shape === 'ast' || shape === 'cycle') {
    input = {type:'root', nodes:[]};
    let cursor = input;
    for (let n = 0; n < 3000; n++) {
      const child = {type:'paren', nodes:[], parent:cursor};
      cursor.nodes.push(child);
      cursor = child;
    }
    cursor.nodes.push({type:'text', value:'x'});
    if (shape === 'cycle') input.nodes = [input];
  } else if (shape === 'parent-cycle') {
    input = {type:'paren', nodes:[]};
    input.parent = input;
  } else {
    const opening = shape === 'paren' ? '(' : '{';
    const closing = shape === 'paren' ? ')' : '}';
    input = opening.repeat(3000) + 'x' + closing.repeat(3000);
  }
  const options = shape === 'clamp' ? {maxDepth:1e9} : {};
  const operation = api === 'default' ? () => braces(input,options) : () => braces[api](input,options);
  assert.throws(operation, error =>
    (error instanceof SyntaxError || error instanceof RangeError) &&
    /exceeds max depth|parent chain contains a cycle/.test(error.message));
  process.exit(0);
}
const cases = ['default:normal', 'expand:parent-cycle'];
for (const api of ['default','create','parse','compile','expand','stringify'])
  for (const shape of ['braces','paren','clamp']) cases.push(`${api}:${shape}`);
for (const api of ['compile','expand','stringify'])
  for (const shape of ['ast','cycle']) cases.push(`${api}:${shape}`);
let failed = 0;
for (const item of cases) {
  const result = spawnSync(process.execPath, ['--stack-size=512', __filename,target,item],
    {encoding:'utf8',timeout:3000,maxBuffer:100000});
  if (result.status !== 0) failed++;
  console.log(JSON.stringify({case:item,passed:result.status===0,status:result.status,
    error:result.error?.code,detail:result.status===0?undefined:result.stderr.slice(0,700)}));
}
console.log(JSON.stringify({total:cases.length,failed,target}));
process.exitCode = failed ? 1 : 0;
