const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  name: String,
  email: String,
  password: String,
  key: String,
  item: [{ id: Number, name:String, str:Number, def:Number }],
  level: Number,
  exp: Number,

  maxHP: { type: Number, default: 10 },
  HP: { type: Number, default: 10 },
  str: { type: Number, default: 5 },
  def: { type: Number, default: 5 },
  battleCount: {type: Number, default: 1},
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
});

playerSchema.methods.incrementHP = function (val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
