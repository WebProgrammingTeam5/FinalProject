const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  itemId: Number,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Item = mongoose.model('User', itemSchema);

module.exports = Item;
