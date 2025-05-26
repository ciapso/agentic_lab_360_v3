"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, position: "absolute", width: "100%" }}
          animate={{ opacity: 1,  position: "absolute", width: "100%" }}
          exit={{ opacity: 0,  position: "absolute", width: "100%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ top: 0, left: 0 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}