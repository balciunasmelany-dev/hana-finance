export function PetalBackground() {
  return (
    <>
      <div className="petal" />
      <div className="petal" />
      <div className="petal" />
      <div className="petal" />
    </>
  )
}

export function spawnConfetti(x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div')
    el.className = 'petal-confetti'
    el.style.left = `${x + (Math.random() - 0.5) * 40}px`
    el.style.top  = `${y}px`
    el.style.animationDelay = `${i * 80}ms`
    el.style.transform      = `rotate(${Math.random() * 360}deg)`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1000)
  }
}
