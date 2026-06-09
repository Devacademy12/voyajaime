"use client";

import Image from "next/image";
import { ROUTES } from "@/app/lib/routes";

const CITIES = [
  { name: "Tunis",    img: "/images/tunisia.jpg",  count: 24 },
  { name: "Djerba",   img: "/images/Djerba.jpg",   count: 18 },
  { name: "Sousse",   img: "/images/sousse.jpg",   count: 12 },
  { name: "Hammamet", img: "/images/medina.jpg",   count: 9  },
  { name: "Kairouan", img: "/images/kairouan.jpg", count: 7  },
];

export default function CitiesGrid() {
  return (
    <div className="cities-grid">
      {CITIES.map((city, i) => (
        <a
          key={i}
          href={`${ROUTES.excursions}?city=${encodeURIComponent(city.name)}`}
          className="city-card"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <Image
            src={city.img}
            alt={city.name}
            fill
            className="city-card-img"
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="city-card-overlay" />
          <span className="city-card-count">{city.count} excursions</span>
          <span className="city-card-name">{city.name}</span>
        </a>
      ))}
    </div>
  );
}