/**
 * Faixa promocional no topo do hero (proporção ~3:1 mobile, ~4:1 desktop).
 */
export type BannerPromoSlide = {
  src: string;
  alt: string;
  /** Abre ao clicar no slide (ex.: Instagram). */
  href?: string;
};

export const BANNERS_PROMO_SLIDES: BannerPromoSlide[] = [
  {
    src: "/banners/promo-1.png",
    alt: "Procurando um produto e não sabe onde encontrar? O Udiz ajuda na sua cidade",
    href: "https://www.instagram.com/udizoficial/",
  },
  {
    src: "/banners/promo-2.png",
    alt: "Use o Udiz na sua cidade — @udizoficial no Instagram",
    href: "https://www.instagram.com/udizoficial/",
  },
  {
    src: "/banners/promo-3.png",
    alt: "Veja onde tem, compare preços e fale direto com o lojista no Udiz",
    href: "https://www.instagram.com/udizoficial/",
  },
];
