"use strict";
let cart = [
    { name: "키보드", price: 50000 },
    { name: "마우스", price: 20000 },
    { name: "모니터", price: 200000 }
];
let total = 0;
for (let item of cart) {
    total = total + item.price;
    console.log(`${item.name}담음, 현재 내야할돈:${total}`);
}
console.log(`최종 합계:${total}원`);
