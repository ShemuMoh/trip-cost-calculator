# Trip Cost Calculator

A simple web app that calculates how much a car journey will cost in fuel.

Enter:
- **Petrol price** (£ per litre)
- **Fuel economy** (MPG, UK gallons)
- **Trip distance** (miles)

and it shows the estimated trip cost, fuel used, and cost per mile — updated live as you type.

A news-style banner shows today's average petrol (E10) and diesel (B7) prices across London, averaged from the [UK government fuel price open data feeds](https://www.gov.uk/guidance/access-fuel-price-data) (Asda, Morrisons, Esso, Motor Fuel Group, Rontec) by a Vercel serverless function (`api/prices.js`, cached for 3 hours). Tap a price to use it in the calculator.

## How it works

```
gallons used = miles ÷ MPG
litres used  = gallons × 4.54609   (UK gallon)
trip cost    = litres × price per litre
```

## Running locally

It's a single static `index.html` — just open it in a browser, or:

```sh
npx serve .
```

## Deployment

Deployed on [Vercel](https://vercel.com) as a static site.
