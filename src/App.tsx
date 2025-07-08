import React from 'react';

// --- 型定義 ---
type KarutaCard = {
  id: number;
  img: string; // 画像URL
  kami_no_ku: string; // 上の句
  shimo_no_ku: string; // 下の句
};

type CardState = 'default' | 'moratta' | 'otetsuki';

// --- ダミーデータ ---
// 本来は百首用意しますが、ここではデモ用に8首用意します。
const ALL_CARDS: KarutaCard[] = [
  { id: 1, img: 'https://placehold.co/600x400/a7c957/ffffff?text=1', kami_no_ku: '秋の田の', shimo_no_ku: 'かりほの庵の 苫をあらみ わが衣手は 露にぬれつつ' },
  { id: 2, img: 'https://placehold.co/600x400/f2e8cf/ffffff?text=2', kami_no_ku: '春過ぎて', shimo_no_ku: '夏来にけらし 白妙の 衣ほすてふ 天の香具山' },
  { id: 3, img: 'https://placehold.co/600x400/bc4749/ffffff?text=3', kami_no_ku: 'あしびきの', shimo_no_ku: '山鳥の尾の しだり尾の ながながし夜を ひとりかも寝む' },
  { id: 4, img: 'https://placehold.co/600x400/6a994e/ffffff?text=4', kami_no_ku: '田子の浦に', shimo_no_ku: 'うち出でてみれば 白妙の 富士の高嶺に 雪は降りつつ' },
  { id: 5, img: 'https://placehold.co/600x400/386641/ffffff?text=5', kami_no_ku: '奥山に', shimo_no_ku: '紅葉踏み分け 鳴く鹿の 声聞く時ぞ 秋は悲しき' },
  { id: 6, img: 'https://placehold.co/600x400/8a5a44/ffffff?text=6', kami_no_ku: 'かささぎの', shimo_no_ku: '渡せる橋に おく霜の 白きを見れば 夜ぞ更けにける' },
  { id: 7, img: 'https://placehold.co/600x400/4f772d/ffffff?text=7', kami_no_ku: '天の原', shimo_no_ku: 'ふりさけ見れば 春日なる 三笠の山に 出でし月かも' },
  { id: 8, img: 'https://placehold.co/600x400/e56b6f/ffffff?text=8', kami_no_ku: 'わが庵は', shimo_no_ku: '都のたつみ しかぞ住む 世をうぢ山と 人はいふなり' },
];

// --- 音声読み上げカスタムフック ---
const useSpeech = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const speak = React.useCallback((kami_no_ku: string, shimo_no_ku: string, onEnd: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const utterance1 = new SpeechSynthesisUtterance(kami_no_ku);
    utterance1.lang = 'ja-JP';
    utterance1.rate = 1.1;

    const utterance2 = new SpeechSynthesisUtterance(shimo_no_ku);
    utterance2.lang = 'ja-JP';
    utterance2.rate = 1.1;

    utterance1.onend = () => {
      // 上の句と下の句の間に少し間を空ける
      setTimeout(() => {
        window.speechSynthesis.speak(utterance2);
      }, 300);
    };

    utterance2.onend = () => {
      setIsPlaying(false);
      onEnd();
    };

    window.speechSynthesis.speak(utterance1);
  }, []);

  const cancel = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return { speak, cancel, isPlaying };
};

// --- メインコンポーネント ---
export default function App() {
  const [cards, setCards] = React.useState<KarutaCard[]>([]);
  const [cardStates, setCardStates] = React.useState<CardState[]>(Array(4).fill('default'));
  const [morattaCount, setMorattaCount] = React.useState(0);
  const [marqueeText, setMarqueeText] = React.useState('');
  const [currentCardIdx, setCurrentCardIdx] = React.useState<number | null>(null);
  const [isAnswering, setIsAnswering] = React.useState(false); // 回答中の操作を無効化するフラグ

  const { speak, cancel, isPlaying } = useSpeech();

  // --- 関数定義 ---

  // 新しいカードを4枚配り、ランダムに1枚を読み上げる
  const dealAndPlayNewCards = React.useCallback(() => {
    // ALL_CARDSをシャッフル
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    const newCards = shuffled.slice(0, 4);
    setCards(newCards);
    setCardStates(Array(4).fill('default'));
    setIsAnswering(false);

    // ランダムに1枚選んで読み上げる
    const newTargetIdx = Math.floor(Math.random() * 4);
    setCurrentCardIdx(newTargetIdx);
    
    const targetCard = newCards[newTargetIdx];
    setMarqueeText(`${targetCard.kami_no_ku} ${targetCard.shimo_no_ku}`);
    speak(targetCard.kami_no_ku, targetCard.shimo_no_ku, () => {});
  }, [speak]);

  // カードクリック時の処理
  const handleCardClick = (clickedIndex: number) => {
    // 回答中、または既に選択済みのカード（もらった/お手つき）は無視
    if (isAnswering || cardStates[clickedIndex] !== 'default') return;

    // 正解かどうかを判定
    if (clickedIndex === currentCardIdx) {
      // --- 正解の場合 ---
      cancel(); // 読み上げを停止
      setIsAnswering(true); // 次の問題へ移行するまで操作をロック

      const newStates = [...cardStates];
      newStates[clickedIndex] = 'moratta';
      setCardStates(newStates);
      setMorattaCount(prev => prev + 1);

      // 1.5秒後に新しいカードを配る
      setTimeout(() => {
        dealAndPlayNewCards();
      }, 1500);
    } else {
      // --- お手つきの場合 ---
      // カードの状態を'otetsuki'に変更するのみ。リセットはしない。
      const newStates = [...cardStates];
      newStates[clickedIndex] = 'otetsuki';
      setCardStates(newStates);
      // これでユーザーは別のカードを選択して再度回答できる
    }
  };
  
  // 再生・停止ボタンの処理
  const handlePlayButtonClick = () => {
    if (isPlaying) {
      cancel();
    } else {
      if (currentCardIdx !== null && cards[currentCardIdx]) {
        const targetCard = cards[currentCardIdx];
        speak(targetCard.kami_no_ku, targetCard.shimo_no_ku, () => {});
      }
    }
  };

  // --- 初期化 ---
  React.useEffect(() => {
    dealAndPlayNewCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時に一度だけ実行

  // --- スタイル定義 ---
  const getBorderColor = (state: CardState) => {
    switch (state) {
      case 'moratta':
        return 'border-green-500 shadow-lg shadow-green-500/50';
      case 'otetsuki':
        return 'border-red-500 shadow-lg shadow-red-500/50';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 grid grid-rows-[auto_1fr_auto] font-sans overflow-x-hidden">
      {/* ヘッダー */}
      <header className="w-full flex justify-between items-center px-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300">かるた</h1>
        <div className="text-lg md:text-xl font-semibold bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
          もらった枚数: <span className="text-2xl md:text-3xl font-bold text-green-600">{morattaCount}</span>
        </div>
      </header>

      {/* カードグリッド */}
      <main
        className="max-w-3xl w-full mx-auto grid grid-cols-2 grid-rows-2 gap-3 md:gap-4 lg:gap-6 p-2 box-border lg:grid-cols-4 lg:grid-rows-1"
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            disabled={isAnswering}
            className={`
              relative flex items-center justify-center
              aspect-[52/73] w-full max-w-[400px] mx-auto rounded-xl overflow-hidden
              border-4 transition-all duration-300 ease-in-out transform
              hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400
              ${getBorderColor(cardStates[index])}
              ${isAnswering ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ aspectRatio: '52 / 73' }}
          >
            <img
              src={card.img}
              alt={`かるた ${card.kami_no_ku} ${card.shimo_no_ku}`}
              className="w-full h-full object-cover"
              style={{ aspectRatio: '52 / 73', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Error'; }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            {cardStates[index] === 'moratta' && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-4xl md:text-6xl font-bold bg-green-500 bg-opacity-70">
                <span>正解！</span>
              </div>
            )}
            {cardStates[index] === 'otetsuki' && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-4xl md:text-6xl font-bold bg-red-500 bg-opacity-70">
                <span>お手つき</span>
              </div>
            )}
          </button>
        ))}
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 dark:bg-black text-white p-3 shadow-2xl-top w-full flex justify-center box-border">
        <div className="w-full max-w-3xl flex items-center justify-between gap-4">
          {/* 流れるテキスト */}
          <div className="flex-grow overflow-hidden">
            <div className="whitespace-nowrap animate-marquee text-lg">
              {marqueeText}
            </div>
          </div>
          {/* 再生ボタン */}
          <button
            onClick={handlePlayButtonClick}
            className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110"
            aria-label={isPlaying ? "停止" : "再生"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
