/* Seed menu — from the restaurant's printed menu (spec §5).
   On first run this seeds the data layer; the owner edits it thereafter.
   Bump MENU_SEED_VERSION when the seed list changes to re-seed existing users. */

window.MENU_SEED_VERSION = 2;
window.MENU_SEED = [
  { id: "b1",  category: "Biryani",    name: "Chicken Dum Biryani",            price: 170, in_stock: true },
  { id: "b2",  category: "Biryani",    name: "Chicken Fry Biryani",            price: 200, in_stock: true },
  { id: "b3",  category: "Biryani",    name: "Chicken Lollipop Gravy Biryani", price: 240, in_stock: true },
  { id: "b4",  category: "Biryani",    name: "Chicken Lollipop Fry Biryani",   price: 220, in_stock: true },
  { id: "b5",  category: "Biryani",    name: "Chicken Joint Biryani",          price: 170, in_stock: true },
  { id: "b6",  category: "Biryani",    name: "Chicken Wings Fry Biryani",      price: 200, in_stock: true },
  { id: "b7",  category: "Biryani",    name: "Chicken Gravy Wings Biryani",    price: 240, in_stock: true },
  { id: "b8",  category: "Biryani",    name: "Chicken Boneless Biryani",       price: 240, in_stock: true },
  { id: "b9",  category: "Biryani",    name: "Biryani Rice (Plain)",           price: 100, in_stock: true },
  { id: "b10", category: "Biryani",    name: "Special Chicken Dum Biryani",    price: 370, in_stock: true, special: true },
  { id: "b11", category: "Biryani",    name: "Chicken Dum Family Pack",        price: 550, in_stock: true, family: true },
  { id: "b12", category: "Biryani",    name: "Chicken Dum Bucket Biryani",     price: 850, in_stock: true, family: true },
  { id: "b13", category: "Biryani",    name: "Biryani Half",                   price: 120, in_stock: true },

  { id: "c1", category: "Curries", name: "Liver Curry",       price: 100, in_stock: true },
  { id: "c2", category: "Curries", name: "Chicken Curry",     price: 100, in_stock: true },
  { id: "c3", category: "Curries", name: "Lollypop Curry",    price: 150, in_stock: true },
  { id: "c4", category: "Curries", name: "Wings Curry",       price: 150, in_stock: true },
  { id: "c5", category: "Curries", name: "Boneless Curry",    price: 150, in_stock: true },

  { id: "s1", category: "Starters", name: "Chicken Leg Piece",  price: 60,  in_stock: true },
  { id: "s2", category: "Starters", name: "Chicken Wings",      price: 100, in_stock: true },
  { id: "s3", category: "Starters", name: "Chicken Gare",       price: 50,  in_stock: true },
  { id: "s4", category: "Starters", name: "Chicken Sticks",     price: 30,  in_stock: true },
  { id: "s5", category: "Starters", name: "Chicken Pakodi",     price: 120, in_stock: true },
  { id: "s6", category: "Starters", name: "Chicken Lollipops",  price: 120, in_stock: true },

  { id: "d1", category: "Cool Drinks", name: "Coca-Cola",          price: 20, in_stock: true },
  { id: "d2", category: "Cool Drinks", name: "Sprite",             price: 20, in_stock: true },
  { id: "d3", category: "Cool Drinks", name: "Fanta",              price: 20, in_stock: true },
  { id: "d4", category: "Cool Drinks", name: "Mineral Water",      price: 20, in_stock: true },
  { id: "d5", category: "Cool Drinks", name: "Sweet Lassi",        price: 40, in_stock: true },
  { id: "d6", category: "Cool Drinks", name: "Masala Coke",        price: 50, in_stock: true },
  { id: "d7", category: "Cool Drinks", name: "Fresh Lime Soda",    price: 30, in_stock: true }
];
