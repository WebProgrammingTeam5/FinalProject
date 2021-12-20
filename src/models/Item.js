const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  itemId: Number,
  user: { type: Schema.Types.ObjectId, ref: 'Player' },
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
