const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  name: String,
  email: String,
  password: String,
  key: String,
  item: [{ id: Number, name: String, str: Number, def: Number }],
  level: { type: Number, default: 1 },
  maxEXP: { type: Number, default: 100 },
  exp: { type: Number, default: 0 },
  maxHP: { type: Number, default: 100 },
  HP: { type: Number, default: 100 },
  str: { type: Number, default: 10 },
  def: { type: Number, default: 10 },
  strItem: { type: Number, default: 0 },
  defItem: { type: Number, default: 0 },
  battleCount: { type: Number, default: 1 },
  rerollCount: { type: Number, default: 0 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
});

playerSchema.methods.incrementHP = function (val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

playerSchema.methods.incrementEXP = function (val) {
  const exp = this.exp + val;
  if (exp >= this.maxEXP) {
    const upStr = parseInt(1 + 2*Math.random());
    const upDef = parseInt(1 + 2*Math.random());
    const upHp = parseInt(5 + 5*Math.random());
    this.level += 1; // 경험치 100을 쌓을 때마다 level 1씩 증가
    this.maxHP += upHp;
    this.str += upStr;
    this.def += upDef; // level up에 따라 player의 능력치 증가
    this.exp = exp - this.maxEXP;
    this.maxEXP += parseInt(this.maxEXP/4); // 레벨이 오를때마다 채워야하는 maxEXP도 증가
    return {upHp, upStr,upDef};
  } else{
    this.exp = exp;
    return false;
  }
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
