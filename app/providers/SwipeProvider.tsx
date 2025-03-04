"use client";
import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { ThumbsDown } from "lucide-react";
import { Heart } from "lucide-react";

interface SwipeContextProps {
  shadowRight: boolean;
  shadowLeft: boolean;
  setShadowRight: Dispatch<SetStateAction<boolean>>;
  setShadowLeft: Dispatch<SetStateAction<boolean>>;
  swipeRight: boolean;
  swipeLeft: boolean;
  setSwipeRight: Dispatch<SetStateAction<boolean>>;
  setSwipeLeft: Dispatch<SetStateAction<boolean>>;
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

  useEffect(() => {
    if (shadowRight) {
      setHiddenRight(false);
    }
    if (shadowLeft) {
      setHiddenLeft(false);
    }
  }, [shadowLeft, shadowRight]);

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
