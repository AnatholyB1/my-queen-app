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
  const { setShadowRight, setShadowLeft } = useSwipeContext();
  const { shadowRight, shadowLeft } = useSwipeContext();

  const handleDragEnd = (
    event: MouseEvent | TouchEvent,
    info: { offset: { x: number; y: number } }
  ) => {
    if (isDragging) {
      isDragging(false);
    }
    if (info.offset.x > 50) {
      setIsSwiped(true);
      if (onSwipe) {
        onSwipe(true, true);
      }
      setShadowLeft(false);
      setShadowRight(false);
    }
    if (info.offset.x < -50) {
      setIsSwiped(true);
      if (onSwipe) {
        onSwipe(true, false);
      }
      setShadowLeft(false);
      setShadowRight(false);
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

  if (isSwiped) return null;

  return (
    <motion.div
      {...props}
      className={`absolute z-10 rounded-lg shadow-xl ${
        shadowLeft && "shadow-teal-400"
      } ${shadowRight && "shadow-red-400"} ${className}`}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}
