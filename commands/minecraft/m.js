require("dotenv").config();
const get = require("../../tasks/mats.task");
const vec3 = require("vec3");

module.exports = {
  async execute(bot, message, username) {
    const xyz = process.env.STASH.split(',')
    const stash = new vec3(xyz);
    if(bot.entity.position.distanceTo(stash) > 10) bot.chat("/kill");
    const args = message.split(" ");
    const order = args[1];
    const tp = args[2];
    const blocks = order.split(",");
    if(bot.inventory.items().length < 36) {
    await get(bot, blocks);}
    bot.chat(`/tpa ${username}`);
    await bot.awaitMessage(/^Your request was accepted, teleporting to: ([A-Za-z0-9_]+)$/);
    await bot.waitForTicks(10);
    const item = await bot.inventory.findInventoryItem(54);
    await bot.equip(item, "hand");
    await bot.waitForTicks(20);
    const pos = bot.entity.position;
    let referenceBlock = bot.blockAt(pos.offset(1, -1, 0), false);
    await bot.placeBlock(referenceBlock, vec3(0, 1, 0)).catch(console.log);
    await bot.waitForTicks(20);
    let chestPos = bot.blockAt(pos.offset(1, 0, 0));
    const chest = await bot.openContainer(chestPos);

    let destSlot = 0;
    for (const [index, slot] of chest.slots.filter((n) => n).entries()) {
      if (slot.type !== 54) {
        bot.clickWindow(slot.slot, 0, 0);
        await bot.waitForTicks(2);
        bot.clickWindow(destSlot, 0, 0);
        destSlot++;
      }
    }
    bot.chat(`/w ${username} done`);
    if(tp) {
      await bot.awaitMessage(/^([A-Za-z0-9_]+) teleported to you!$/);
    }
    bot.chat("/kill");
  },
};
