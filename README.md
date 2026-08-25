# IBOCA · Aire de Bogotá

Vista en vivo del **Índice Bogotano de Calidad del Aire (IBOCA)** con Next.js, React Aria Components y Tailwind CSS.

## Datos

Lee el backend público del mapa IBOCA:

`http://iboca.ambientebogota.gov.co/iboca/service/allstations/true`

El fetch corre en el servidor (o en `/api/stations`) para evitar CORS y se revalida cada 5 minutos.

## Desarrollo

```bash
npm install
npm run dev
```

## Stack

- Next.js App Router
- React Aria Components
- Tailwind CSS v4
- Tipografía: Fraunces + Manrope
