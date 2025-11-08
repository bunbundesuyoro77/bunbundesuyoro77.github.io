// game.js

// ====================================
// A. 初期設定とデータ定義
// ====================================

// 1. CanvasとContextの取得
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// マップのタイルサイズ (20列 x 15行 = 640x480)
const TILE_SIZE = 32;
const MAP_ROWS = 15;
const MAP_COLS = 20;

// マップデータ（1=壁, 0=草地, 2=草むら）
const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// プレイヤーのスプライト画像を読み込む (player.pngはHTMLと同じフォルダに配置)
const playerSprite = new Image();
playerSprite.src = "/assets/player.png";

// プレイヤーオブジェクト (タイル移動用プロパティを含む)
let player = {
  x: 5 * TILE_SIZE,
  y: 5 * TILE_SIZE,
  size: TILE_SIZE,
  direction: 0, // 0:下, 1:左, 2:右, 3:上 (スプライトシートの行)
  frame: 0, // 現在のフレーム (スプライトシートの列)
  animationTimer: 0,
  isMoving: false, // キー入力受付フラグとして使用
  isMovingTile: false, // タイル移動中かどうか
  targetX: 5 * TILE_SIZE, // 移動目標X座標
  targetY: 5 * TILE_SIZE, // 移動目標Y座標
};

// ... playerオブジェクトの定義後に追加 ...

// NPCデータの定義
const npcs = [
  {
    x: 10 * TILE_SIZE, // 10列目
    y: 8 * TILE_SIZE, // 8行目
    direction: 0, // 0:下向き (スプライトシートの行)
    dialogue: "こんにちは！\nこのさきはきけんらしいぞ。", // \n は会話中の改行用
  },
  {
    x: 15 * TILE_SIZE, // 15列目
    y: 5 * TILE_SIZE, // 5行目
    direction: 2, // 2:右向き
    dialogue: "マップをあるくと、ポケモンにであうかもね。",
  },
];

// バトル固有の状態に加えて、会話の状態も定義します
let talkingState = {
  activeNPC: null, // 現在会話中のNPCオブジェクト
  dialogueLines: [], // 表示する会話テキストの配列
  currentLineIndex: 0,
  message: "",
};

// バトル/エンカウント関連データ
const ENCOUNTER_RATE = 100; // エンカウント率 (1/100)
let gameState = "exploring"; // 'exploring' or 'battle'
let keys = {}; // 押されているキーを管理

// 技の定義
const moves = {
  scratch: { name: "ひっかく", power: 15 },
  ember: { name: "ひのこ", power: 20 },
  growl: { name: "なきごえ", power: 0 },
  tackle: { name: "たいあたり", power: 10 }, // 敵の技として追加
};

// ポケモンデータ
const enemyPokemon = {
  name: "ポッポ",
  hp: 25,
  maxHp: 25,
  attack: 10,
  level: 5,
  moves: [moves.tackle],
};
const playerPokemon = {
  name: "ヒトカゲ",
  hp: 30,
  maxHp: 30,
  attack: 12,
  level: 5,
  moves: [moves.scratch, moves.ember, moves.growl, moves.scratch], // 4つの技
};
const battleCommands = ["たたかう", "ポケモン", "バッグ", "にげる"];

// バトル固有の状態
let battleState = {
  activeCommand: 0, // コマンド選択インデックス
  message: "", // 画面下部に表示するメッセージ
  phase: "command", // 'command', 'moveSelect', 'playerAction', 'enemyAction', 'message', 'result'
  activeMoveIndex: 0, // 技選択インデックス
};
let currentMove = null; // 現在使用している技を保持

// ====================================
// B. 入力処理 (キーイベント)
// ====================================

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  keys[e.key.toLowerCase()] = true; // w, a, s, d も対応
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  keys[e.key.toLowerCase()] = false;
});

// ====================================
// C. バトルヘルパー関数
// ====================================

/** 簡易ダメージ計算関数 */
function calculateDamage(attacker, defender, move) {
  if (move.power === 0) {
    return 0;
  }

  // 簡易式: ダメージ = (技の威力 + 攻撃力) / 2
  let damage = Math.floor((move.power + attacker.attack) / 2);

  if (damage < 1) {
    damage = 1;
  }
  return damage;
}

function startBattle() {
  gameState = "battle";
  keys = {}; // キー入力をリセット

  // バトルステータスを初期化
  battleState.phase = "message"; // まずメッセージ表示待ちから開始
  battleState.activeCommand = 0;
  battleState.activeMoveIndex = 0;
  battleState.message = "ポケモンがあらわれた！"; // このメッセージを表示

  // 敵HPとプレイヤーHPをリセット（デバッグ用）
  enemyPokemon.hp = enemyPokemon.maxHp;
  playerPokemon.hp = playerPokemon.maxHp;

  // キーバッファを強制的に空にする (前の移動やEnterキーが残るのを防ぐ)
  keys["Enter"] = false;
  keys["ArrowUp"] = keys["w"] = false;
  keys["ArrowDown"] = keys["s"] = false;
  keys["ArrowLeft"] = keys["a"] = false;
  keys["ArrowRight"] = keys["d"] = false;
}

/** バトル終了処理 */
function endBattle() {
  // プレイヤーと敵のHPをリセット
  playerPokemon.hp = playerPokemon.maxHp;
  enemyPokemon.hp = enemyPokemon.maxHp;

  // マップに戻った後、すぐにコマンド選択状態に戻るのを防ぐため
  battleState.phase = "command";
  battleState.message = "コマンドをせんたくしてください。";
}

// ====================================
// D. 描画関数
// ====================================
/** ポケモンの名前とHPバーを描画するヘルパー関数 */
function drawStatusBox(pokemon, x, y, type) {
  const boxWidth = 200;
  const boxHeight = 60;

  // ステータスボックスの枠
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, boxWidth, boxHeight);
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  // 名前とレベル
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText(`${pokemon.name} Lv${pokemon.level}`, x + 10, y + 20);

  // HPバーの背景 (黒い枠)
  ctx.strokeStyle = "black";
  ctx.strokeRect(x + 10, y + 35, 120, 10);

  // HPバーの本体 (緑色)
  const hpRate = pokemon.hp / pokemon.maxHp;
  const hpBarWidth = 120 * hpRate;

  ctx.fillStyle = "green";
  if (hpRate < 0.2) {
    ctx.fillStyle = "red"; // HPが少ないと赤
  } else if (hpRate < 0.5) {
    ctx.fillStyle = "yellow"; // HPが中程度だと黄色
  }
  ctx.fillRect(x + 10, y + 35, hpBarWidth, 10);

  // 味方ポケモンのみHP数値を表示
  if (type === "味方") {
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`${pokemon.hp}/${pokemon.maxHp}`, x + 140, y + 45);
  }
}

function drawMap() {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const tileType = map[r][c];
      const drawX = c * TILE_SIZE;
      const drawY = r * TILE_SIZE;

      // 初代風の色設定
      if (tileType === 1) {
        ctx.fillStyle = "#666666"; // 壁 (濃い灰色)
      } else if (tileType === 2) {
        ctx.fillStyle = "#609060"; // 草むら (濃い緑色)
      } else {
        ctx.fillStyle = "#A8C090"; // 草地 (明るい緑色)
      }

      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
    }
  }
}

function draw() {
  drawMap();

  // ★ 1. NPCの描画 (変更)
  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    npcs.forEach((npc) => {
      const S_X = 0 * TILE_SIZE; // NPCはアニメーションさせないので常に0フレーム (立ち絵)
      const S_Y = npc.direction * TILE_SIZE;

      ctx.drawImage(
        playerSprite, // 仮に同じplayer.pngスプライトを使用
        S_X,
        S_Y,
        TILE_SIZE,
        TILE_SIZE,
        npc.x,
        npc.y,
        TILE_SIZE,
        TILE_SIZE
      );
    });
  }

  // 2. プレイヤーの描画 (既存のコード)
  if (!playerSprite.complete || playerSprite.naturalWidth === 0) return;

  const S_X = player.frame * TILE_SIZE;
  const S_Y = player.direction * TILE_SIZE;

  const D_X = player.x;
  const D_Y = player.y;

  ctx.drawImage(
    playerSprite,
    S_X,
    S_Y,
    TILE_SIZE,
    TILE_SIZE, // ソース (切り出し位置とサイズ)
    D_X,
    D_Y,
    TILE_SIZE,
    TILE_SIZE // デスティネーション (描画位置とサイズ)
  );
}

function drawBattleScreen() {
  // 描画コンテキストのリセット
  ctx.beginPath();

  // 1. バトル背景
  ctx.fillStyle = "lightblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. ポケモンステータス表示 (名前とHPバー)
  const enemyBoxX = canvas.width - 240;
  const enemyBoxY = 20;
  drawStatusBox(enemyPokemon, enemyBoxX, enemyBoxY, "敵");

  const playerBoxX = 20;
  const playerBoxY = canvas.height - 180;
  drawStatusBox(playerPokemon, playerBoxX, playerBoxY, "味方");

  // 3. 画面下部のUIエリア全体の枠と背景
  const boxY = canvas.height - 100;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.fillRect(0, boxY, canvas.width, 100); // 下部全体を白で塗りつぶす
  ctx.strokeRect(0, boxY, canvas.width, 100); // 外枠

  // 4. エリアの定義
  const uiBoxWidth = 280; // コマンド/技エリアの幅
  const uiBoxX = canvas.width - uiBoxWidth; // コマンド/技エリアのX座標 (360)

  // 5. コマンド/技エリアの境界線（メッセージエリアとの区切り線）
  // メッセージ/結果フェーズでは描画しない
  if (battleState.phase === "command" || battleState.phase === "moveSelect") {
    ctx.strokeRect(uiBoxX, boxY, uiBoxWidth, 100);
  }

  // 6. メッセージの描画 (左側エリアまたは画面全体)
  ctx.fillStyle = "black";

  let currentMessage = battleState.message;

  if (battleState.phase === "command" || battleState.phase === "moveSelect") {
    // ★ コマンド/技選択フェーズ ★
    ctx.font = "20px Arial";
    if (battleState.phase === "command") {
      currentMessage = "コマンドをせんたくしてください。";
    } else {
      // moveSelect
      currentMessage = "わざをせんたくしてください。";
    }
    // 単一行メッセージを描画 (Y座標は中央付近)
    ctx.fillText(currentMessage, 10, boxY + 55);
  } else {
    // ★ メッセージ / 結果 フェーズ (message, playerAction, enemyAction, result) ★
    // メッセージが画面全体を使用するフェーズ
    ctx.font = "20px Arial";

    // 区切り文字 '|' でメッセージを分割し、2行で描画
    const lines = currentMessage.split(" | ");

    // 1行目: boxY + 30
    ctx.fillText(lines[0], 10, boxY + 30);

    // 2行目 (メッセージが2行に分かれている場合): boxY + 55 (30 + 25px line height)
    if (lines.length > 1) {
      ctx.fillText(lines[1], 10, boxY + 55);
    }
  }

  // 7. フェーズに応じたUIの描画 (右側エリアのみ)
  ctx.fillStyle = "black";
  ctx.font = "24px Arial"; // コマンドと技は24pxのまま維持

  if (battleState.phase === "command") {
    // ★ コマンド選択フェーズ (右側: uiBoxXから開始) ★

    const padding = 10;
    const col1X = uiBoxX + padding;
    const col2X = uiBoxX + uiBoxWidth / 2 + padding;

    for (let i = 0; i < battleCommands.length; i++) {
      const text = battleCommands[i];

      const x = i % 2 === 0 ? col1X : col2X;
      const cmdY = i < 2 ? boxY + 30 : boxY + 60;

      if (battleState.activeCommand === i) {
        ctx.fillText("▶︎", x - 20, cmdY);
      }
      ctx.fillText(text, x, cmdY);
    }
  } else if (battleState.phase === "moveSelect") {
    // ★ 技選択フェーズ (右側: uiBoxXから開始) ★

    const padding = 10;

    const col1X = uiBoxX + padding;
    const col2X = uiBoxX + uiBoxWidth / 2 + padding;

    for (let i = 0; i < playerPokemon.moves.length; i++) {
      const move = playerPokemon.moves[i];
      const text = move.name;

      const x = i % 2 === 0 ? col1X : col2X;
      const moveY = i < 2 ? boxY + 30 : boxY + 60;

      if (battleState.activeMoveIndex === i) {
        ctx.fillText("▶︎", x - 20, moveY);
      }
      ctx.fillText(text, x, moveY);
    }
  }

  // 8. メッセージ表示待ちの促し (画面右下に表示)
  if (battleState.phase === "message" || battleState.phase === "result") {
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    // Y座標を boxY + 80 に調整し、メッセージの2行目と干渉しないようにする
    ctx.fillText("ENTERキーを押してください", canvas.width - 250, boxY + 80);
  }
}

/** 会話画面の描画関数 (新規追加) */
function drawDialogueScreen() {
  // 画面下部のUIエリア全体の枠と背景 (バトル画面と同じデザインを使用)
  const boxY = canvas.height - 100;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.fillRect(0, boxY, canvas.width, 100); // 下部全体を白で塗りつぶす
  ctx.strokeRect(0, boxY, canvas.width, 100); // 外枠

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";

  const lines = talkingState.message.split("\n");

  // 1行目
  ctx.fillText(lines[0], 10, boxY + 30);

  // 2行目 (改行がある場合)
  if (lines.length > 1) {
    ctx.fillText(lines[1], 10, boxY + 55);
  }

  // メッセージ送りプロンプト
  ctx.font = "18px Arial";
  ctx.fillText("ENTERキーを押してください", canvas.width - 250, boxY + 80);
}

// ====================================
// E. バトルロジック
// ====================================

/** プレイヤーの行動処理 */
function handlePlayerAction() {
  const move = currentMove;

  // 1. 技名メッセージ
  // battleState.message = `${playerPokemon.name}の ${move.name}！`; // この行は後で上書きされます

  // 2. ダメージ計算と適用
  let damage = 0;
  if (move.power > 0) {
    damage = calculateDamage(playerPokemon, enemyPokemon, move);
    enemyPokemon.hp -= damage;
    if (enemyPokemon.hp < 0) enemyPokemon.hp = 0;
  }

  // 3. 次のフェーズへ
  currentMove = null;

  if (enemyPokemon.hp === 0) {
    battleState.phase = "result"; // 敵のHPが0なら勝利
    // 長いメッセージに区切り文字 '|' を挿入し、2行で表示できるようにする
    battleState.message = `${playerPokemon.name}の ${move.name}！ | ${enemyPokemon.name}に ${damage} のダメージ！ ${enemyPokemon.name}はたおれた！`;
  } else {
    battleState.phase = "message"; // メッセージ表示待ちへ移行
    if (move.power > 0) {
      // 途中のメッセージにも区切り文字 '|' を挿入し、2行で表示できるようにする
      battleState.message = `${playerPokemon.name}の ${move.name}！ | ${enemyPokemon.name}に ${damage} のダメージ！`;
    } else {
      // 変化技の場合
      battleState.message = `${playerPokemon.name}の ${move.name}！ | しかし、なにもおこらない！`;
    }
  }
}

/** 敵の行動処理 */
function handleEnemyAction() {
  // 敵の技を選択 (ここではランダムではなく最初の技を選択)
  const move = enemyPokemon.moves[0];

  // 1. 技名メッセージ
  // battleState.message = `${enemyPokemon.name}の ${move.name}！`; // この行は後で上書きされます

  // 2. ダメージ計算と適用
  const damage = calculateDamage(enemyPokemon, playerPokemon, move);
  playerPokemon.hp -= damage;
  if (playerPokemon.hp < 0) playerPokemon.hp = 0;

  // 3. 次のフェーズへ
  if (playerPokemon.hp === 0) {
    battleState.phase = "result"; // プレイヤーのHPが0なら敗北
    // 敗北メッセージにも区切り文字 '|' を挿入し、2行で表示できるようにする
    battleState.message = `${enemyPokemon.name}の ${move.name}！ | ${playerPokemon.name}に ${damage} のダメージ！ ${playerPokemon.name}はたおれた...`;
  } else {
    battleState.phase = "message"; // メッセージ表示待ちへ移行
    // 途中のメッセージにも区切り文字 '|' を挿入し、2行で表示できるようにする
    battleState.message = `${enemyPokemon.name}の ${move.name}！ | ${playerPokemon.name}に ${damage} のダメージ！`;
  }
}

/** バトル中のキー入力処理 */
function handleBattleInput() {
  // ------------------------------------
  // コマンド選択フェーズ
  // ------------------------------------
  if (battleState.phase === "command") {
    // 十字キーによる選択ロジック
    if (keys["ArrowUp"] || keys["w"]) {
      if (battleState.activeCommand >= 2) {
        battleState.activeCommand -= 2;
      }
    } else if (keys["ArrowDown"] || keys["s"]) {
      if (battleState.activeCommand <= 1) {
        battleState.activeCommand += 2;
      }
    } else if (keys["ArrowLeft"] || keys["a"]) {
      if (battleState.activeCommand % 2 === 1) {
        battleState.activeCommand -= 1;
      }
    } else if (keys["ArrowRight"] || keys["d"]) {
      if (battleState.activeCommand % 2 === 0 && battleCommands.length > battleState.activeCommand + 1) {
        battleState.activeCommand += 1;
      }
    } else if (keys["Enter"]) {
      const selectedCmd = battleCommands[battleState.activeCommand];

      if (selectedCmd === "にげる") {
        gameState = "exploring";
        endBattle(); // 逃走時も状態をリセット
      } else if (selectedCmd === "たたかう") {
        battleState.phase = "moveSelect";
        battleState.activeMoveIndex = 0;
      }
    }

    // ------------------------------------
    // 技選択フェーズ
    // ------------------------------------
  } else if (battleState.phase === "moveSelect") {
    const totalMoves = playerPokemon.moves.length;

    // 十字キーによる選択ロジック
    if (keys["ArrowUp"] || keys["w"]) {
      if (battleState.activeMoveIndex >= 2) {
        battleState.activeMoveIndex -= 2;
      }
    } else if (keys["ArrowDown"] || keys["s"]) {
      if (battleState.activeMoveIndex <= 1 && totalMoves > battleState.activeMoveIndex + 2) {
        battleState.activeMoveIndex += 2;
      }
    } else if (keys["ArrowLeft"] || keys["a"]) {
      if (battleState.activeMoveIndex % 2 === 1) {
        battleState.activeMoveIndex -= 1;
      }
    } else if (keys["ArrowRight"] || keys["d"]) {
      if (battleState.activeMoveIndex % 2 === 0 && battleState.activeMoveIndex < totalMoves - 1) {
        battleState.activeMoveIndex += 1;
      }
    } else if (keys["Enter"]) {
      const selectedMove = playerPokemon.moves[battleState.activeMoveIndex];

      currentMove = selectedMove;
      battleState.phase = "playerAction"; // プレイヤー行動へ移行
    }
  }

  // ★★★ 修正点1: 選択フェーズでのキーリセットを分離 ★★★
  // Enterキーはメッセージ待ちフェーズと競合するため、ここでは方向キーのみリセット
  if (keys["ArrowUp"] || keys["w"] || keys["ArrowDown"] || keys["s"] || keys["ArrowLeft"] || keys["a"] || keys["ArrowRight"] || keys["d"]) {
    keys["ArrowUp"] = keys["w"] = keys["ArrowDown"] = keys["s"] = false;
    keys["ArrowLeft"] = keys["a"] = keys["ArrowRight"] = keys["d"] = false;
  }
}

/** 探索中のキー入力処理 (新規追加) */
function handleExploreInput() {
  // Enterキーを押して会話を開始するロジック
  if (keys["Enter"]) {
    // プレイヤーの現在位置（タイル座標）
    const pRow = Math.floor(player.y / TILE_SIZE);
    const pCol = Math.floor(player.x / TILE_SIZE);

    // プレイヤーが向いている方向のタイル座標
    let targetRow = pRow;
    let targetCol = pCol;

    if (player.direction === 3) targetRow -= 1; // 上
    else if (player.direction === 0) targetRow += 1; // 下
    else if (player.direction === 1) targetCol -= 1; // 左
    else if (player.direction === 2) targetCol += 1; // 右

    // NPCがターゲットタイルにいるかチェック
    const foundNpc = npcs.find((npc) => {
      const npcRow = Math.floor(npc.y / TILE_SIZE);
      const npcCol = Math.floor(npc.x / TILE_SIZE);
      return npcRow === targetRow && npcCol === targetCol;
    });

    if (foundNpc) {
      // NPCの会話を開始
      gameState = "talking";
      talkingState.activeNPC = foundNpc;
      talkingState.dialogueLines = foundNpc.dialogue.split("\n");
      talkingState.currentLineIndex = 0;
      talkingState.message = talkingState.dialogueLines[0];

      // プレイヤーをNPCの方に向かせる (NPCはプレイヤーと反対を向く)
      if (player.direction === 3) foundNpc.direction = 0; // プレイヤーが上向きなら、NPCは下向き
      else if (player.direction === 0) foundNpc.direction = 3; // プレイヤーが下向きなら、NPCは上向き
      else if (player.direction === 1) foundNpc.direction = 2; // プレイヤーが左向きなら、NPCは右向き
      else if (player.direction === 2) foundNpc.direction = 1; // プレイヤーが右向きなら、NPCは左向き
    }

    // Enterキーはここでリセット
    keys["Enter"] = false;
  }
}

// ====================================
// F. ゲームロジック (update)
// ====================================

function update() {
  // 1. タイル移動中の位置更新と移動完了チェック
  if (player.isMovingTile) {
    const moveStep = 4;

    if (player.x < player.targetX) player.x += moveStep;
    if (player.x > player.targetX) player.x -= moveStep;
    if (player.y < player.targetY) player.y += moveStep;
    if (player.y > player.targetY) player.y -= moveStep;

    if (Math.abs(player.x - player.targetX) <= moveStep && Math.abs(player.y - player.targetY) <= moveStep) {
      player.x = player.targetX;
      player.y = player.targetY;
      player.isMovingTile = false;
      player.isMoving = false;

      // ★★★ 修正点2: タイル移動完了時にキーリセットを削除 (キーアップで対応) ★★★
      // 削除することで、キーリピートが有効になり、連続移動が可能になるはず
      // keys["ArrowUp"] = keys["w"] = false;
      // keys["ArrowDown"] = keys["s"] = false;
      // keys["ArrowLeft"] = keys["a"] = false;
      // keys["ArrowRight"] = keys["d"] = false;
    }

    // 2. 移動中でない場合のキー入力受付と移動開始
  } else {
    let dx = 0;
    let dy = 0;
    let moved = false;

    // 方向キーとスプライト方向の定義
    // player.direction: 0:下, 1:左, 2:右, 3:上
    if (keys["ArrowUp"] || keys["w"]) {
      dy = -1;
      player.direction = 1; // 上向き
      moved = true;
    } else if (keys["ArrowDown"] || keys["s"]) {
      dy = 1;
      player.direction = 0; // 下向き
      moved = true;
    } else if (keys["ArrowLeft"] || keys["a"]) {
      dx = -1;
      player.direction = 2; // 左向き
      moved = true;
    } else if (keys["ArrowRight"] || keys["d"]) {
      dx = 1;
      player.direction = 3; // 右向き
      moved = true;
    }

    if (moved) {
      const nextTileRow = Math.floor(player.y / TILE_SIZE) + dy;
      const nextTileCol = Math.floor(player.x / TILE_SIZE) + dx;

      // 衝突判定 (壁 1 のチェック)
      if (map[nextTileRow] && map[nextTileRow][nextTileCol] !== 1) {
        player.targetX = player.x + dx * TILE_SIZE;
        player.targetY = player.y + dy * TILE_SIZE;
        player.isMovingTile = true;
        player.isMoving = true;
      }
    }
  }

  // 3. ランダムエンカウント判定ロジック
  if (player.isMovingTile && gameState === "exploring") {
    const currentRow = Math.floor(player.y / TILE_SIZE);
    const currentCol = Math.floor(player.x / TILE_SIZE);

    if (map[currentRow][currentCol] === 2) {
      // 草むら (2)
      if (Math.floor(Math.random() * ENCOUNTER_RATE) === 0) {
        console.log("ポケモンがあらわれた！");
        startBattle();
        return;
      }
    }
  }

  // 4. アニメーションの更新ロジック
  if (player.isMovingTile) {
    player.animationTimer++;

    if (player.animationTimer >= 5) {
      // 3コマアニメーション (0:立ち絵 -> 1:左足 -> 2:右足 の簡易循環)
      if (player.frame === 0) {
        player.frame = 1;
      } else if (player.frame === 1) {
        player.frame = 2;
      } else if (player.frame === 2) {
        player.frame = 0;
      }

      player.animationTimer = 0;
    }
  } else {
    player.frame = 0;
    player.animationTimer = 0;
  }
}

// ====================================
// G. メインループ
// ====================================

function gameLoop() {
  // 1. 入力処理
  if (gameState === "exploring") {
    // ★ 変更点: 探索時の入力処理を呼び出す
    handleExploreInput();
  } else if (gameState === "battle" && battleState.phase !== "message" && battleState.phase.indexOf("Action") === -1) {
    handleBattleInput();
  } else if (gameState === "talking" && keys["Enter"]) {
    // ★ 変更点: 会話メッセージ送り/終了処理を追加
    talkingState.currentLineIndex++;

    if (talkingState.currentLineIndex < talkingState.dialogueLines.length) {
      // 次の行へ
      talkingState.message = talkingState.dialogueLines[talkingState.currentLineIndex];
    } else {
      // 会話終了
      gameState = "exploring";
      talkingState.activeNPC = null;
      talkingState.message = "";
      talkingState.dialogueLines = [];
      talkingState.currentLineIndex = 0;
    }
    keys["Enter"] = false;
  }

  // 2. バトル処理の実行
  if (gameState === "battle") {
    // ... (バトルロジックは変更なし。ただし、Enterキーリセットの位置によっては調整が必要です) ...
    if (keys["Enter"]) {
      // ... (既存のメッセージ/結果フェーズの処理) ...
      // Enterキーのリセット
      keys["Enter"] = false;
    }
  }

  // 3. 描画
  if (gameState === "exploring") {
    update();
    draw();
  } else if (gameState === "battle") {
    drawBattleScreen();
  } else if (gameState === "talking") {
    // ★ 変更点: 会話画面の描画を追加。探索画面の上にメッセージボックスを重ねる
    // updateは呼び出しません（プレイヤーの移動を停止するため）
    draw(); // マップとNPCを描画
    drawDialogueScreen(); // 会話ボックスを描画
  }

  // 4. ループ継続
  requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();
