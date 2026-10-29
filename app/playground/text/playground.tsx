"use client";

import { ArrowLeft, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { KineticTitle } from "@/components/kinetic-title";
import { useTheme } from "@/components/theme-provider";
import styles from "./playground.module.css";

export function TextPlayground() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div className={`site-container ${styles.shell}`}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} /> 回首页
        </Link>
        <button
          type="button"
          className={styles.theme}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label={`切换到${resolvedTheme === "dark" ? "浅色" : "深色"}主题`}
        >
          {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <header className={styles.intro}>
        <h1>
          文字游乐场
          <span className={styles.star} aria-hidden="true">
            *
          </span>
        </h1>
        <p>这次，文字可以拿来玩。</p>
      </header>
      <KineticTitle />
      <div className={styles.instructions}>
        <p>
          <span>移动</span>隔着玻璃，拨动文字。
        </p>
        <p>
          <span>点击</span>让字母自由落下。
        </p>
        <p>
          <span>拖拽</span>捡起来，再扔一次。
        </p>
      </div>
    </div>
  );
}
