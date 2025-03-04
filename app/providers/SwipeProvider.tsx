"use client";
import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

interface SwipeContextProps {
  shadowRight: boolean;

  shadowLeft: boolean;

  setShadowRight: Dispatch<SetStateAction<boolean>>;

  setShadowLeft: Dispatch<SetStateAction<boolean>>;
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

  return (
    <SwipeContext.Provider
      value={{ shadowRight, shadowLeft, setShadowRight, setShadowLeft }}
    >
      {shadowLeft && (
        <>
          <div className=" z-[5]  line-gradient-left-green " />
          <div className=" z-[5]  line-gradient-right-green " />
        </>
      )}
      {children}
      {shadowRight && (
        <>
          <div className=" z-[5]  line-gradient-left-red " />
          <div className=" z-[5]  line-gradient-right-red " />
        </>
      )}
    </SwipeContext.Provider>
  );
};
