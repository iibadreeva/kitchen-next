/** Значения совпадают с Prisma enum Category / Unit. */
export const CATEGORY_OPTIONS = [
  { label: "Овощи", value: "VEGETABLES" },
  { label: "Фрукты", value: "FRUITS" },
  { label: "Мясо", value: "MEAT" },
  { label: "Молочные продукты", value: "DAIRY" },
  { label: "Специи", value: "SPICES" },
  { label: "Другое", value: "OTHER" },
] as const;

export const UNIT_OPTIONS = [
  { label: "Граммы", value: "GRAMS" },
  { label: "Килограммы", value: "KILOGRAMS" },
  { label: "Литры", value: "LITERS" },
  { label: "Миллилитры", value: "MILLILITERS" },
  { label: "Штуки", value: "PIECES" },
] as const;

export const CATEGORY_VALUES = CATEGORY_OPTIONS.map((o) => o.value) as [
  (typeof CATEGORY_OPTIONS)[number]["value"],
  ...(typeof CATEGORY_OPTIONS)[number]["value"][],
];

export const UNIT_VALUES = UNIT_OPTIONS.map((o) => o.value) as [
  (typeof UNIT_OPTIONS)[number]["value"],
  ...(typeof UNIT_OPTIONS)[number]["value"][],
];
