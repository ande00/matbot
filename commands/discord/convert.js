const { AttachmentBuilder, SlashCommandBuilder } = require("discord.js");
const getPixels = require("get-pixels");
const data = require("../../pallette.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("convert")
    .setDescription("png to json")
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("png")
    ),
  async execute(interaction, bot) {
    const file = interaction.options.getAttachment("image");
    await interaction.deferReply();

    async function storeData(img) {

      const pixels = img.data.toString().split(",255,");

      const json = {
        size: img.shape,
        chunks: [],
        blocks: {},
      };

      const blocks = [];

      pixels.forEach((pixel) => {
        const rgb = pixel.split(",");
        const get = data.mats.filter(
          (i) =>
            i.color[0] === +rgb[0] &&
            i.color[1] === +rgb[1] &&
            i.color[2] === +rgb[2]
        );
        const block = get.map((a) => a.id);
        blocks.push(block[0]);
      });

      blocks.forEach(function (x) {
        json.blocks[x] = (json.blocks[x] || 0) + 1;
      });

      const linesX = [];

      const lineSize = file.width;
      for (let i = 0; i < blocks.length; i += lineSize) {
        const line = blocks.slice(i, i + lineSize);
        linesX.push(line);
      }

      const chunkLinesX = [];

      linesX.forEach((line) => {
        const chunkLine = [];
        for (let i = 0; i < line.length; i += 16) {
          const lineChunk = line.slice(i, i + 16);
          chunkLine.push(lineChunk);
        }
        chunkLinesX.push(chunkLine);
      });

      function pivot(rows) {
        const max = Math.max(...chunkLinesX.map((xs) => xs.length));
        const columns = [];
        for (let i = 0; i < max; i++) {
          const col = [];
          for (const row of rows) {
            if (row[i]) col.push(row[i]);
          }
          columns.push(col);
        }
        return columns;
      }

      let chunkAmount = (file.height / 16) * (file.width / 16);

      for (let i = 0; i < chunkAmount; i++) {
        json.chunks.push({
          id: i,
          data: [],
          xz: [],
        });
      }

      const chunkLinesY = pivot(chunkLinesX);

      let a = 0;
      chunkLinesY.forEach(function (line, index) {
        for (let i = 0; i < line.length; i += 16) {
          const dt = json.chunks[a];
          const chunk = line.slice(i, i + 16);
          dt.data = chunk;
          dt.xz.push(index * 16, i);
          a++;
        }
      });

      const jsonFile = new AttachmentBuilder(Buffer.from(JSON.stringify(json)), {
        name: `map.json`,
      });

      interaction.editReply({files : [jsonFile]})
    }

    getPixels(file.url, async function (err, pixels) {
      if (err) {
        console.log(err);
        interaction.editReply("Bad image path");
        return;
      } else {
        await storeData(pixels);
      }
    });
  },
};
