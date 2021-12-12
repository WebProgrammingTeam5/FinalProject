const axios = require('axios');
const crypto = require('crypto');
//const jwt = require('jsonwebtoken'); webtoken 사용 안 할 거면 없어도 괜찮을 것 같아요
const { Player } = require('./models');

// 입력받은 string을 암호화해서 return
const encryptPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

// header의 Authorization으로 이용자 검색
const authorization = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(' ');
  if (bearer !== 'Bearer') return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

module.exports = {
  encryptPassword,
  authorization,
};
