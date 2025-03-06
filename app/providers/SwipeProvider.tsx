"use client";
import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { ThumbsDown, Heart, Sparkles } from "lucide-react";

interface SwipeContextProps {
  shadowRight: boolean;
  shadowLeft: boolean;
  setShadowRight: Dispatch<SetStateAction<boolean>>;
  setShadowLeft: Dispatch<SetStateAction<boolean>>;
  swipeRight: boolean;
  swipeLeft: boolean;
  setSwipeRight: Dispatch<SetStateAction<boolean>>;
  setSwipeLeft: Dispatch<SetStateAction<boolean>>;
  isMatched: boolean;
  setIsMatched: Dispatch<SetStateAction<boolean>>;
}

const SwipeContext = createContext<SwipeContextProps | undefined>(undefined);

export const useSwipeContext = () => {
  const context = useContext(SwipeContext);

  if (!context) {
    throw new Error("useSwipeContext must be used within a SwipeProvider");
  }

  return context;
};

export const SwipeProvider: React.FC<React.PropsWithChildren<object>> = ({
  children,
}) => {
  const [shadowRight, setShadowRight] = useState(false);
  const [shadowLeft, setShadowLeft] = useState(false);
  const [hiddenLeft, setHiddenLeft] = useState(true);
  const [hiddenRight, setHiddenRight] = useState(true);
  const [swipeRight, setSwipeRight] = useState(false);
  const [swipeLeft, setSwipeLeft] = useState(false);

  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    if (shadowRight) {
      setHiddenRight(false);
    }
    if (shadowLeft) {
      setHiddenLeft(false);
    }
  }, [shadowLeft, shadowRight]);

  useEffect(() => {
    if (isMatched) {
      const timer = setTimeout(() => {
        setIsMatched(false); // Reset isMatched after hiding
      }, 1000); // Adjust the timeout duration as needed

      return () => clearTimeout(timer);
    }
  }, [isMatched]);

  const handleAnimationEndLeft = () => {
    if (!shadowLeft) {
      setHiddenLeft(true);
    }
  };

  const handleAnimationEndRight = () => {
    if (!shadowRight) {
      setHiddenRight(true);
    }
  };

  function MatchedScreen() {
    if (!isMatched) {
      return null;
    }
    return (
      <div
        className={`absolute top-0 right-0 w-screen h-screen bg-green-400/60 z-20 appearAndDisappear`}
      >
        <Sparkles className="absolute top-[30%] left-1/4 fill-yellow-400 w-24 h-24 z-20" />
        <h1 className="text-4xl text-white font-extrabold leading-tighter text-center absolute top-[45%] z-20 left-1/2 -translate-x-1/2">
          MATCH !
        </h1>
        <Sparkles className="absolute top-1/2 left-1/2 fill-yellow-400 w-24 h-24 z-20" />
      </div>
    );
  }

  return (
    <SwipeContext.Provider
      value={{
        shadowRight,
        shadowLeft,
        setShadowRight,
        setShadowLeft,
        swipeRight,
        swipeLeft,
        setSwipeRight,
        setSwipeLeft,
        isMatched,
        setIsMatched,
      }}
    >
      <>
        <div
          className={`z-[5] ${
            shadowLeft ? "appear" : "disappear"
          } line-gradient-left-green ${hiddenLeft ? "hidden" : ""}`}
          onAnimationEnd={handleAnimationEndLeft}
        />
        <div
          className={`z-[5] ${
            shadowLeft ? "appear" : "disappear"
          } line-gradient-right-green ${hiddenLeft ? "hidden" : ""}`}
          onAnimationEnd={handleAnimationEndLeft}
        />
      </>
      <ThumbsDown
        className={`slide-in-left absolute fill-red-600 z-10 top-1/3 left-2 ${
          swipeLeft ? "" : "hidden"
        }  h-16 w-16`}
        onAnimationEnd={() => setSwipeLeft(false)}
      />
      <MatchedScreen />
      {children}
      <Heart
        className={`slide-in-right absolute z-10 top-1/3 right-2 fill-red-500 h-16 w-16 ${
          swipeRight ? "" : "hidden"
        }`}
        onAnimationEnd={() => setSwipeRight(false)}
      />
      <>
        <div
          className={`z-[5] ${
            shadowRight ? "appear" : "disappear"
          } line-gradient-left-red ${hiddenRight ? "hidden" : ""}`}
          onAnimationEnd={handleAnimationEndRight}
        />
        <div
          className={`z-[5] ${
            shadowRight ? "appear" : "disappear"
          } line-gradient-right-red ${hiddenRight ? "hidden" : ""}`}
          onAnimationEnd={handleAnimationEndRight}
        />
      </>
    </SwipeContext.Provider>
  );
};
