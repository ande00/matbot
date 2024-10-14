const { GoalNear, GoalLookAtBlock } = require("mineflayer-pathfinder").goals;
const vec3 = require("vec3");
require('dotenv').config();

module.exports = async (bot, blocks) => {
  //bot.chat('/kill')
  console.log(blocks)
  const xyz = process.env.STASH.split(',')
  const pos = new vec3(xyz);
  let chestPos = bot.blockAt(pos.offset(0, 0, -1));
  let value1 = 0
    for (const item of await bot.inventory.items().filter(a => a.type === 54)) {
      value1 += item.count
    };
  await bot.pathfinder.goto(new GoalLookAtBlock(pos.offset(0, 0, -1), bot.world));
  await bot.waitForTicks(10);
  const chest = await bot.openContainer(chestPos);
  await bot.waitForTicks(1);
  if(1>value1){
  await chest.withdraw(54, 0, 1);}
  await bot.closeWindow(chest);

  for (const block of blocks) {
    await bot.waitForTicks(1);
    const b = block.split(':')
    const n = Number(b[1])
    const md = Number(b[0].replace(/^\D+/g, ''))
    
    let itemType = 0
    let x = 0
    let l = 0
    if (b[0].startsWith("c")) {
      itemType = 251;
      x = 2;
      l = 1;
    } else if (b[0].startsWith("t")) {
      itemType = 159;
      x = 0;
      l = -1;
    }
    let value = 0
    for (const item of await bot.inventory.items().filter(a => a.type === itemType && a.metadata === md)) {
      value += item.count
    };
    if(n>value){
    await bot.pathfinder.goto(new GoalNear(pos.offset(0, 0, md+1)));
    //await waitUntil(()=> bot.entity.position.distanceTo(pos.offset(md+1, 0, 0)) < 2);
    await bot.waitForTicks(2);
    let chestPos2 = bot.blockAt(pos.offset(x-oddOrEven(md), 2, md+1));
    await bot.waitForTicks(2);
    await bot.pathfinder.goto(new GoalLookAtBlock(pos.offset(x-oddOrEven(md), 2, md+1), bot.world));
    await bot.waitForTicks(1);
    const chest2 = await bot.openContainer(chestPos2);
    await bot.waitForTicks(1); 
    await chest2.withdraw(itemType, md, n-value)
    await bot.closeWindow(chest2);
    await bot.waitForTicks(2);}
  }

  function oddOrEven(num) {
    return ( num & 1 ) ? 1 : 0;
  }
};
