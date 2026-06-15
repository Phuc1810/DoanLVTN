import OrderCard from './OrderCard'

export default function OrderTable({ orders }) {
  return (
    <div className="d-grid gap-3">
      {orders.map((order) => <OrderCard key={order.MaDon} order={order} />)}
    </div>
  )
}
