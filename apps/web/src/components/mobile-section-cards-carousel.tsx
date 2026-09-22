"use client";

import { Carousel, CarouselContent, CarouselItem } from "@portfolio/ui/components/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Children, useState, type ReactNode } from "react";

export function MobileSectionCardsCarousel({ children }: { children: ReactNode }) {
  const count = Children.count(children);
  const [autoplay] = useState(() =>
    Autoplay({ delay: 3600, stopOnInteraction: true, stopOnMouseEnter: true }),
  );

  return (
    <Carousel
      opts={{ align: "start", loop: count > 1 }}
      plugins={[autoplay]}
      className="px-4 sm:hidden"
      aria-label="Key statistics"
    >
      <CarouselContent className="-ml-3">
        {Children.map(children, (child) => (
          <CarouselItem className="basis-[92%] pl-3">{child}</CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
