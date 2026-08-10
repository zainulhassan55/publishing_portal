type StatCardProps = {
  value: string
  label: string
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="card-quiet">
      <p className="font-display text-3xl font-semibold text-ink-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{label}</p>
    </div>
  )
}

export default StatCard
