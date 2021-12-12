const { Player, Item } = require('./models');

const initialize = async () => {
  await Player.deleteMany();
  await Item.deleteMany();

  console.log('completed');
};

initialize();
