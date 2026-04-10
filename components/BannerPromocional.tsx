"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BANNERS_PROMO_SLIDES,
  type BannerPromoSlide,
} from "@/lib/bannersPromo";

const INTERVAL_MS = 10_000;

export default function BannerPromocional() {
  const slides = BANNERS_PROMO_SLIDES;
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [go, reduceMotion, slides.length]);

  const slide = slides[index]!;

  return (
    <section
      className="w-full max-w-[100vw] pt-6 sm:pt-7 md:pt-8 px-2 sm:px-3 md:px-4"
      aria-roledescription="carousel"
      aria-label="Destaques e novidades do Udiz"
    >
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/20 shadow-xl">
        <div
          className="relative w-full aspect-[3/1] md:aspect-[16/5] touch-pan-y"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientX;
            if (end == null) return;
            const d = end - start;
            if (d > 60) go(-1);
            else if (d < -60) go(1);
          }}
        >
          {slides.map((s, i) => (
            <SlideImage
              key={s.src}
              slide={s}
              visible={i === index}
              priority={i === 0}
            />
          ))}

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 text-white text-lg leading-none flex items-center justify-center hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Slide anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 text-white text-lg leading-none flex items-center justify-center hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Próximo slide"
              >
                ›
              </button>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div
            className="flex justify-center gap-2 py-2 bg-black/20"
            role="tablist"
            aria-label="Selecionar slide"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-8 bg-orange-400"
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-white/80">
        <a
          href={slide.href ?? "https://www.instagram.com/udizoficial/"}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-white/40 hover:decoration-orange-300"
        >
          @udizoficial
        </a>
        {" · Instagram"}
      </p>

      <span className="sr-only" aria-live="polite">
        Slide {index + 1} de {slides.length}: {slide.alt}
      </span>
    </section>
  );
}

function SlideImage({
  slide,
  visible,
  priority,
}: {
  slide: BannerPromoSlide;
  visible: boolean;
  priority?: boolean;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas trocáveis (.svg/.webp/.jpg)
    <img
      src={slide.src}
      alt={slide.alt}
      width={1600}
      height={400}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className="absolute inset-0 w-full h-full object-cover object-center"
    />
  );

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        visible ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      {slide.href ? (
        <a
          href={slide.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
          aria-label={`${slide.alt} (abre em nova aba)`}
        >
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}
