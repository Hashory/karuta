import { useState, useEffect } from 'react'
import './App.css'

interface KarutaCard {
  id: number
  kamiku: string // 上の句
  shimoku: string // 下の句
  author: string // 作者
}

function App() {
  const [cards, setCards] = useState<KarutaCard[]>([])
  const [currentCard, setCurrentCard] = useState<KarutaCard | null>(null)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [readingCard, setReadingCard] = useState(false)
  const [selectedCards, setSelectedCards] = useState<KarutaCard[]>([])
  const [gameMode, setGameMode] = useState<'practice' | 'competitive'>('practice')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)

  // サンプルのかるたカード（百人一首から抜粋）
  const karutaData: KarutaCard[] = [
    {
      id: 1,
      kamiku: "秋の田の かりほの庵の 苫をあらみ",
      shimoku: "わが衣手は 露にぬれつつ",
      author: "天智天皇"
    },
    {
      id: 2,
      kamiku: "春すぎて 夏来にけらし 白妙の",
      shimoku: "衣ほすてふ 天の香具山",
      author: "持統天皇"
    },
    {
      id: 3,
      kamiku: "あしびきの 山鳥の尾の しだり尾の",
      shimoku: "ながながし夜を ひとりかも寝む",
      author: "柿本人麻呂"
    },
    {
      id: 4,
      kamiku: "田子の浦に うち出でて見れば 白妙の",
      shimoku: "富士の高嶺に 雪は降りつつ",
      author: "山部赤人"
    },
    {
      id: 5,
      kamiku: "奥山に 紅葉踏み分け 鳴く鹿の",
      shimoku: "声きく時ぞ 秋は悲しき",
      author: "猿丸大夫"
    },
    {
      id: 6,
      kamiku: "鵲の 渡せる橋に 置く霜の",
      shimoku: "白きを見れば 夜ぞ更けにける",
      author: "中納言家持"
    }
  ]

  useEffect(() => {
    setCards(karutaData)
    
    // Web Speech API サポートチェック
    if ('speechSynthesis' in window) {
      setSpeechSupported(true)
      
      // 音声リストの読み込み（初回は空の場合があるため）
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices()
        if (voices.length > 0) {
          console.log('音声リストが読み込まれました:', voices.length, '個の音声が利用可能')
        }
      }
      
      // 音声リストが変更された時のイベントリスナー
      speechSynthesis.addEventListener('voiceschanged', loadVoices)
      loadVoices() // 初回読み込み
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  // 音声読み上げ関数
  const speakText = (text: string) => {
    if (!speechSupported || !speechEnabled) return

    // 既存の音声を停止
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // 日本語の音声設定
    utterance.lang = 'ja-JP'
    utterance.rate = 0.8 // 読み上げ速度（通常より少し遅く）
    utterance.pitch = 1.0 // 音程
    utterance.volume = 0.8 // 音量

    // 利用可能な日本語音声を探す
    const voices = speechSynthesis.getVoices()
    const japaneseVoice = voices.find(voice => 
      voice.lang.includes('ja') || voice.name.includes('Japanese')
    )
    if (japaneseVoice) {
      utterance.voice = japaneseVoice
    }

    window.speechSynthesis.speak(utterance)
  }

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setCurrentCard(null)
    if (gameMode === 'competitive') {
      // 競技モード：ランダムに選んだカードを場に配置
      const shuffledCards = [...karutaData].sort(() => Math.random() - 0.5)
      setSelectedCards(shuffledCards.slice(0, 4))
    }
    readNextCard()
  }

  const readNextCard = () => {
    if (cards.length === 0) return
    
    const randomCard = cards[Math.floor(Math.random() * cards.length)]
    setCurrentCard(randomCard)
    setReadingCard(true)
    
    // 音声で上の句を読み上げ
    if (speechSupported && speechEnabled) {
      speakText(randomCard.kamiku)
    }
    
    // 読み上げ時間を調整（音声がある場合は少し長く）
    const readingDuration = speechSupported && speechEnabled ? 5000 : 3000
    setTimeout(() => {
      setReadingCard(false)
    }, readingDuration)
  }

  const handleCardClick = (card: KarutaCard) => {
    if (!currentCard || readingCard) return

    if (card.id === currentCard.id) {
      setScore(score + 1)
      alert('正解！')
    } else {
      alert('不正解！')
    }
    
    setTimeout(() => {
      readNextCard()
    }, 1000)
  }

  const resetGame = () => {
    // 音声を停止
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    setGameStarted(false)
    setCurrentCard(null)
    setScore(0)
    setReadingCard(false)
    setSelectedCards([])
  }

  if (!gameStarted) {
    return (
      <div className="app">
        <div className="menu">
          <h1>🎴 かるた</h1>
          <p>日本の伝統的なかるたゲームです</p>
          
          <div className="game-mode-selection">
            <h3>ゲームモードを選択</h3>
            <label>
              <input
                type="radio"
                value="practice"
                checked={gameMode === 'practice'}
                onChange={(e) => setGameMode(e.target.value as 'practice')}
              />
              練習モード
            </label>
            <label>
              <input
                type="radio"
                value="competitive"
                checked={gameMode === 'competitive'}
                onChange={(e) => setGameMode(e.target.value as 'competitive')}
              />
              競技モード
            </label>
          </div>

          <div className="speech-settings">
            <h3>音声設定</h3>
            <label>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={(e) => setSpeechEnabled(e.target.checked)}
                disabled={!speechSupported}
              />
              音声読み上げを有効にする
              {!speechSupported && <span className="not-supported">（お使いのブラウザは音声読み上げに対応していません）</span>}
            </label>
          </div>
          
          <button onClick={startGame} className="start-button">
            ゲーム開始
          </button>
          
          <div className="instructions">
            <h3>遊び方</h3>
            <ul>
              <li>上の句が読まれたら、対応する下の句のカードをクリック</li>
              <li>練習モード：全てのカードから選択</li>
              <li>競技モード：限られたカードから素早く選択</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="game-header">
        <h1>🎴 かるた</h1>
        <div className="game-info">
          <span>スコア: {score}</span>
          <span>モード: {gameMode === 'practice' ? '練習' : '競技'}</span>
          {speechSupported && (
            <label className="speech-toggle">
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={(e) => setSpeechEnabled(e.target.checked)}
              />
              🔊 音声
            </label>
          )}
          <button onClick={resetGame} className="reset-button">
            メニューに戻る
          </button>
        </div>
      </div>

      <div className="reading-area">
        <h2>読み上げ</h2>
        {currentCard ? (
          <div className={`reading-card ${readingCard ? 'reading' : ''}`}>
            <div className="kamiku">{currentCard.kamiku}</div>
            <div className="author">- {currentCard.author} -</div>
            {readingCard && (
              <div className="reading-indicator">
                {speechSupported && speechEnabled ? '🔊 読み上げ中...' : '読み上げ中...'}
              </div>
            )}
          </div>
        ) : (
          <div className="waiting">次の札を準備中...</div>
        )}
      </div>

      <div className="cards-area">
        <h3>札を取ろう！</h3>
        <div className="cards-grid">
          {(gameMode === 'practice' ? cards : selectedCards).map((card) => (
            <div
              key={card.id}
              className={`card ${readingCard ? 'disabled' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="shimoku">{card.shimoku}</div>
              <div className="card-author">{card.author}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
