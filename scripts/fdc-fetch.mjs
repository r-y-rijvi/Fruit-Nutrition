const KEY = process.env.FDC_KEY || "DEMO_KEY";
const ids = [169910, 169097, 171705, 168153, 169134, 171711, 171688, 169926];
const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods?api_key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fdcIds: ids, format: "full" }),
});
console.log("status", res.status, "remaining", res.headers.get("x-ratelimit-remaining"));
const foods = await res.json();
const want = /^(Energy|Water|Protein|Total lipid|Carbohydrate, by difference|Fiber, total dietary|Sugars, total|Vitamin C|Vitamin A, RAE|Carotene, beta|Lycopene|Lutein|Folate, DFE|Folate, total|Potassium|Magnesium|Calcium|Iron, Fe|Vitamin K|Vitamin E \(alpha|Vitamin B-6|Copper|Manganese|Pantothenic|Fatty acids, total monounsaturated|Thiamin)/;
for (const f of foods) {
  console.log(`\n## ${f.fdcId} | ${f.description} | ${f.dataType}`);
  for (const n of f.foodNutrients) {
    const name = n.nutrient?.name; if (!name || !want.test(name)) continue;
    if (n.amount == null) continue;
    console.log(`  ${name}: ${n.amount} ${n.nutrient.unitName}`);
  }
}
