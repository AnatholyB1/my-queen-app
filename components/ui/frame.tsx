import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  HTMLMotionProps,
  PanInfo,
} from "framer-motion";
import { useSwipeContext } from "@/app/providers/SwipeProvider";

// Some styling for the card
interface SwipeCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  onSwipe?: (isSwiped: boolean, choice: boolean) => void;
  className?: string;
  isDragging?: (isDragging: boolean) => void;
}

export default function SwipeCard({
  children,
  onSwipe,
  className,
  isDragging,
  ...props
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const [isSwiped, setIsSwiped] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const { setShadowRight, setShadowLeft, setSwipeLeft, setSwipeRight } =
    useSwipeContext();
  const { shadowRight, shadowLeft } = useSwipeContext();
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );

  const handleDragEnd = (
    event: MouseEvent | TouchEvent,
    info: { offset: { x: number; y: number } }
  ) => {
    if (isDragging) {
      isDragging(false);
    }
    if (info.offset.x > 50) {
      setSwipeDirection("right");
      setIsSwiped(true);
      setSwipeRight(true);
    }
    if (info.offset.x < -50) {
      setSwipeDirection("left");
      setIsSwiped(true);
      setSwipeLeft(true);
    }
    if (info.offset.x > -50 && info.offset.x < 50) {
      //stop animation
      x.stop();
      //reset the card position
      x.set(0);
    }
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isDragging) {
      isDragging(true);
    }
    if (info.offset.x > 50) {
      setShadowRight(false);
      setShadowLeft(true);
    }
    if (info.offset.x < -50) {
      setShadowLeft(false);
      setShadowRight(true);
    }
    if (info.offset.x > -50 && info.offset.x < 50) {
      setShadowLeft(false);
      setShadowRight(false);
    }
  };

  if (isEnded) {
    return null;
  }

  return (
    <motion.div
      {...props}
      className={`absolute duration-100 z-10 rounded-lg shadow-xl fade-in ${
        shadowLeft && "shadow-teal-400"
      } ${shadowRight && "shadow-red-400"} ${className}`}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={isSwiped ? { opacity: 1, x: x.get(), rotate: rotate.get() } : {}}
      animate={
        isSwiped
          ? {
              opacity: 0,
              x: swipeDirection === "right" ? 200 : -200,
              rotate: swipeDirection === "right" ? 20 : -20,
            }
          : {}
      }
      transition={isSwiped ? { duration: 0.2 } : {}}
      onAnimationComplete={() => {
        if (isSwiped) {
          setIsSwiped(false);
          setShadowLeft(false);
          setShadowRight(false);
          if (onSwipe) {
            onSwipe(true, swipeDirection === "right");
            setIsEnded(true);
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
