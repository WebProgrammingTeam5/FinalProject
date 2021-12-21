const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  name: String,
  email: String,
  password: String,
  key: String,
  item: [{ id: Number, name: String, str: Number, def: Number }],
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  maxHP: { type: Number, default: 100 },
  HP: { type: Number, default: 100 },
  str: { type: Number, default: 10 },
  def: { type: Number, default: 10 },
  battleCount: { type: Number, default: 1 },
  rerollCount: { type: Number, default: 0 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
});

playerSchema.methods.incrementHP = function (val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
