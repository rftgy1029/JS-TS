type Item = {
  name: string
  price: number
}

let cart: Item[] = []

// HTML에서 필요한 애들 찾아오기
const cartCountEl = document.querySelector('#cart-count')!
const cartListEl = document.querySelector('#cart-list')!
const totalEl = document.querySelector('#total')!
const clearBtn = document.querySelector('#clearBtn')!
const productBtns = document.querySelectorAll<HTMLButtonElement>('#products button')

function getTotal(cart: Item[]): number {
  let total = 0
  for (let item of cart) {
    total = total + item.price
  }
  return total
}

function render() {
  // 개수, 총합 업데이트
  cartCountEl.textContent = String(cart.length)
  totalEl.textContent = getTotal(cart).toLocaleString()

  // 장바구니 목록 업데이트
  cartListEl.innerHTML = "" // 일단 비우고
  if (cart.length === 0) {
    cartListEl.textContent = "비어있음"
  } else {
    for (let item of cart) {
      const div = document.createElement('div')
      div.textContent = `- ${item.name} (${item.price.toLocaleString()}원)`
      cartListEl.appendChild(div)
    }
  }
}

// 상품 버튼에 기능 붙이기
for (let btn of productBtns) {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name!
    const price = Number(btn.dataset.price!)
    
    const item: Item = { name, price }
    cart.push(item)
    render()
  })
}

clearBtn.addEventListener('click', () => {
  cart = []
  render()
})

// 처음 한 번 그리기
render()