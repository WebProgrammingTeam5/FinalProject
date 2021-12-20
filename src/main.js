const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { constantManager, mapManager, eventManager } = require('./datas/Manager');
const { Player, Item } = require('./models');
const { authorization, encryptPassword } = require('./utils');

// const init = require('./initialize');

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

app.get('/dead', (req, res) => {
  res.render('dead');
});

// 신규 유저 등록(email, password)
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const encryptedPassword = encryptPassword(password);
  if (await Player.exists({ name })) {
    return res.send({ err: 'Player already exists' });
  }
  const player = new Player({
    name,
    email,
    password: encryptedPassword,
    maxHP: 10,
    HP: 10,
    item: [{ name: '기본 아이템' }],
    level: 1, // 레벨 시스템 추가
    exp: 0,
    str: 5,
    def: 5,
    x: 0,
    y: 0,
  });
  await player.save();
  return res.send({ _id: player._id });
});

// 로그인
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const encryptedPassword = encryptPassword(password);

  try {
    const player = await Player.findOne({ email, password: encryptedPassword });
    if (player !== null) {
      player.key = encryptPassword(crypto.randomBytes(20));
      await player.save();
      res.send({ key: player.key });
    } else {
      res.send({ err: 'Not Found' });
    }
  } catch (err) {
    return res.sendStatus(404);
  }
});

// 게임 진행
app.post('/action', authorization, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  let field = {};
  let actions = [];

  if (action === 'query') {
    field = mapManager.getField(player.x, player.y);
    if (!field) res.sendStatus(400);
  } else if (action === 'move') {
    const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
    console.log('new direction input');
    let x = player.x;
    let y = player.y;
    // 플레이어 이동
    if (direction === 0) {
      y += 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y -= 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    field = mapManager.getField(x, y); // (x,y) 칸의 맵 데이터를 가져옴
    if (!field) res.sendStatus(400);

    player.x = x;
    player.y = y;

    // 각 칸의 이벤트를 실행시키는 부분(미완성)
    const events = field.events;
    console.log(events);
    const actions = [];
    if (events && events.length > 0) {
      const random = Math.random() * 100;
      let _event;
      if (random < events[0].percent) {
        _event = events[0];
      } else {
        _event = events[1];
      }
      if (_event.type === 'battle') {
        console.log('battle');
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리
        const description = eventManager.getEvent(
          'battle',
          _event.monster
        ).description;
        event = { description: description };
        //   const monster = monsterManager.getMonster(_event.monster);
        //   const changedHp = Math.max(0, parseInt(monster.str - player.str/10)) + Math.max(0, parseInt(monster.def - player.def/10));
        //   player.incrementHP(-changedHp);
        actions.push({
          url: '/action',
          text: ['공격'],
          params: { choice, action: 'battle' },
        },{
          url: '/action',
          text: ['방어'],
          params: { direction, action: 'battle' },
        },{
          url: '/action',
          text: ['아이템'],
          params: { choice, action: 'battle' },
        }
        );
        return res.send({ player, field, event, actions });
        // 턴제 전투 시스템 - battle용 버튼 렌더링 (미완성)
      } else if (_event.type === 'item') {
        console.log('item');
        const description = eventManager.getEvent(
          'item',
          _event.item
        ).description;
        event = { description: description };
        const item = itemManager.getMonster(_event.item);
        player.str += item.str;
        player.def += item.def;
      }
    }
    await player.save();
  }
  else if(action === 'battle'){
    console.log('battle mode');
    const choice = req.body.choice;
    console.log(choice);
    let x = player.x;
    let y = player.y;
    return res.send({ player, field, event, actions });
    // 상대 몬스터도 확률적으로 공격, 방어
    // choice에 따라 몬스터와 전투 결과 (미완성)
  
  }
  //이동할 수 있는 방향으로의 버튼 렌더링
  field.canGo.forEach((direction, i) => {
    actions.push({
      url: '/action',
      text: ['북', '동', '남', '서'][direction],
      params: { direction, action: 'move' },
    });
  });

  return res.send({ player, field, event, actions });
});

app.post('/reborn', authorization, async (req, res) => {
  const player = req.player;
  player.HP = player.MaxHP;
  player.x = 0;
  player.y = 0;
  const getRandomNumber = () => {
    return Math.floor(Math.random() * player.item.length);
  };
  if (player.item.length > 0) {
    player.item.pop(player.item[getRandomNumber()]);
  }
  await player.save();

  return res.send({ player });
});

app.listen(port, () => {
  console.log(`listening at port: ${port}...`);
});
