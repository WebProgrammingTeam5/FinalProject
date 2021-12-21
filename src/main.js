const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const {
  constantManager,
  mapManager,
  eventManager,
  itemManager,
  monsterManager,
} = require('./datas/Manager');
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

app.get('/lobby', (req, res) => {
  res.render('lobby');
});

app.get('/game', (req, res) => {
  res.render('game');
});

app.get('/dead', (req, res) => {
  res.render('dead');
});

// 신규 유저 등록(email, password)
app.post(
  '/signup',
  body('name').isLength({ min: 3, max: 10 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6, max: 12 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const encryptedPassword = encryptPassword(password);
    if (await Player.exists({ name })) {
      return res.send({ err: 'Player already exists' });
    }
    const maxHP = Math.floor(Math.random() * 20) + 91; // 최대체력 91에서 110사이로 랜덤 설정
    const player = new Player({
      name,
      email,
      password: encryptedPassword,
      item: [{ name: '기본 아이템' }],
      maxHP,
      HP: maxHP,
      str: Math.floor(Math.random() * 10) + 6,
      def: Math.floor(Math.random() * 10) + 6, // 능력치 6에서 15사이로 랜덤 설정
    });
    await player.save();
    return res.send({ _id: player._id });
  }
);

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

// 시작 능력치 리롤
app.post('/reroll', authorization, async (req, res) => {
  const { action } = req.body;
  const player = req.player;

  if (action === 'reroll') {
    player.maxHP = Math.floor(Math.random() * 20) + 91; // 체력 91에서 110사이로 랜덤 설정
    player.str = Math.floor(Math.random() * 10) + 6;
    player.def = Math.floor(Math.random() * 10) + 6; // 능력치 6에서 15사이로 랜덤 설정
    player.HP = player.maxHP;
    player.rerollCount += 1;
    player.save();
  } else if (action === 'select') {
    player.rerollCount = 6;
    player.save();
  }
  return res.send({ player });
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
    console.log(direction);
    if (direction === 0) {
      y += 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y -= 1;
    } else if (direction === 3) {
      x -= 1;
    } else if (direction === -1) {
      field = mapManager.getField(x, y);
      const description = req.body.description;
      event = { description };
      player.battleCount = 1;
      await player.save();
      let actions = [];
      field.canGo.forEach((direction, i) => {
        actions.push({
          url: '/action',
          text: ['북', '동', '남', '서'][direction],
          params: { direction, action: 'move' },
        });
      });
      return res.send({ player, field, event, actions });
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
      let _event = null;
      const random = parseInt(Math.random() * 100);

      // random 숫자가 꽂힐 과녁 만들기
      let tempPercent = [];
      events.forEach((e, index) => {
        for (let i = 0; i < e.percent; i++) {
          tempPercent.push(index);
        }
      });

      // events가 2개 이상이어도 가능
      const eventIndex = tempPercent[random];
      _event = events[eventIndex];
      console.log('d' + random);
      console.log(tempPercent);

      if (_event.type === 'battle') {
        console.log('battle');
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리
        const monster = monsterManager.getMonster(_event.monster);
        event = { description: `${monster.name}을(를) 마주쳤다!` };
        actions.push({
          url: '/action',
          text: ['다음'],
          params: { choice: 'next', action: 'battle', monster },
        });
        await player.save();
        return res.send({ player, field, event, actions });
      } else if (_event.type === 'item') {
        console.log('item');
        const description = eventManager.getEvent(
          'item',
          _event.item
        ).description;
        event = { description: description };
        const item = itemManager.getItem(_event.item);
        player.item.push(item);
        // player.str += item.str;
        // player.def += item.def;
        // 능력치 증가는 스탯창에서 보유 아이템 리스트 모아서 한꺼번에 계산하는 것이 좋을 것 같아요!
      }
    }
    await player.save();
  } else if (action === 'battle') {
    console.log('battle mode');
    let x = player.x;
    let y = player.y;
    field = mapManager.getField(x, y);

    const { choice, monster } = req.body;
    console.log(choice);

    if (choice === 'next') {
      event = {
        monster: `${monster.name}\n${monster.hp}/${monster.maxHp}\n`,
        description: `${player.name}은(는) 무엇을 할까?`,
      };
      // 턴제 전투 버튼 렌더링
      actions.push(
        {
          url: '/action',
          text: ['공격'],
          params: { choice: 'attack', action: 'battle', monster },
        },
        {
          url: '/action',
          text: ['방어'],
          params: { choice: 'defense', action: 'battle', monster },
        }
      );
      // 도망 카운트
      console.log('battleCount: ' + player.battleCount);

      // 도망 카운트가 1(테스트용) 이상이면 도망 버튼 생김
      if (player.battleCount >= 1) {
        actions.push({
          url: '/action',
          text: ['도망'],
          params: {
            direction: -1,
            action: 'move',
            description: '무사히 도망쳤다!',
          },
        });
      }
      player.battleCount++;
      await player.save();
      return res.send({ player, field, event, actions });
    }

    let monsterDef = monster.def;
    let playerDef = player.def;
    // 0은 공격, 1은 방어;
    let monsterChoice;
    let playerChoice;

    const calDamage = (str, def) => {
      const plusOrMinus = [1, -1];
      if (str * 2 <= def) {
        return parseInt(Math.random() * 2) + 1;
      }
      // 공격에 가중치를 둠
      const normalDamage = parseInt((str * 2 - def) / 2);
      const randomDamage =
        parseInt((Math.random() * normalDamage) / 4 + 1) *
        plusOrMinus[Math.round(Math.random())];
      console.log(randomDamage);
      const totalDamage = normalDamage + randomDamage;
      return totalDamage;
    };

    // 이하 턴제 전투 시스템
    // 공격: 기본 계산된 대미지 +- 작은 랜덤 대미지
    // 방어: 방어 시 def 2배
    if (choice === 'defense') {
      playerChoice = 1;
      playerDef = player.def * 2;
    }
    // 몬스터 행동 선택
    const monsterRandom = Math.random() * monster.maxHp;
    if (monster.hp < monsterRandom) {
      // 몬스터 방어
      // hp가 적을수록 몬스터의 방어 확률 증가
      monsterChoice = 1;
      monsterDef = monsterDef * 2;
    } else {
      // 몬스터 공격
      monsterChoice = 0;
      const damage = calDamage(monster.str, playerDef);
      console.log('dd' + damage);
      player.incrementHP(-damage);
    }
    if (choice === 'attack') {
      playerChoice = 0;
      const damage = calDamage(player.str, monsterDef);
      monster.hp = Math.max(0, monster.hp - damage);
      if (monster.hp === 0) {
        player.incrementEXP(monsterRandom / 2); // monster의 초기 HP의 절반만큼 경험치 상승
        event = { description: `${monster.name}을(를) 무찔렀다!` };
        actions.push({
          url: '/action',
          text: ['다음'],
          params: {
            direction: -1,
            action: 'move',
            description: '이젠 어디로 갈까?',
          },
        });
        return res.send({ player, field, event, actions });
      }
    }
    const resultDialog = [
      [
        `서로 공격했다!`,
        `${monster.name}은(는) 방어 태세를 취한 ${player.name}을(를) 공격했다!`,
      ],
      [
        `${monster.name}은(는) 방어 태세를 취했다!`,
        `서로 방어 태세를 취했다! 아무 일도 일어나지 않았다...`,
      ],
    ];
    event = {
      monster: `${monster.name}\n${monster.hp}/${monster.maxHp}\n`,
      description: resultDialog[monsterChoice][playerChoice],
    };
    actions.push({
      url: '/action',
      text: ['다음'],
      params: { choice: 'next', action: 'battle', monster },
    });
    await player.save();
    return res.send({ player, field, event, actions });
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
  player.HP = player.maxHP;
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
