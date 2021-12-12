const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { constantManager, mapManager } = require('./datas/Manager');
const { Player, Item } = require('./models');
const { authentication, encryptPassword } = require('./utils');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.get('/', (req, res) => {
  res.render('index', { gameName: constantManager.gameName });
});

app.get('/game', (req, res) => {
  res.render('game');
});

// 신규 유저 등록
app.post('/signup', async (req, res) => {
  const { name } = req.body;
  if (await Player.exists({ name })) {
    return res.status(400).send({ error: 'Player already exists' });
  }
  const key = encryptPassword(crypto.randomBytes(20));
  const player = new Player({
    name,
    maxHP: 10,
    HP: 10,
    str: 5,
    def: 5,
    x: 0,
    y: 0,
    key,
  });
  await player.save();
  return res.send({ key });
});

// 게임 진행
app.post('/action', authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  let field = null;
  let actions = [];
  if (action === 'query') {
    field = mapManager.getField(req.player.x, req.player.y);
  } else if (action === 'move') {
    const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
    let x = req.player.x;
    let y = req.player.y;
    if (direction === 0) {
      y -= 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y += 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    const events = field.events;
    const actions = [];
    if (events.length > 0) {
      // TODO : 확률별로 이벤트 발생하도록 변경
      const _event = events[0];
      if (_event.type === 'battle') {
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리

        event = { description: '늑대와 마주쳐 싸움을 벌였다.' };
        player.incrementHP(-1);
      } else if (_event.type === 'item') {
        event = { description: '포션을 획득해 체력을 회복했다.' };
        player.incrementHP(1);
        player.HP = Math.min(player.maxHP, player.HP + 1);
      }
    }

    await player.save();
  }

  field.canGo.forEach((direction, i) => {
    if (direction === 1) {
      actions.push({
        url: '/action',
        text: i,
        params: { direction: i, action: 'move' },
      });
    }
  });

  return res.send({ player, field, event, actions });
});

app.listen(port, () => {
  console.log(`listening at port: ${port}...`);
});
